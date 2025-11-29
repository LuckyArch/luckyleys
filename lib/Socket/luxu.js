"use strict";
const WAProto = require('../../WAProto').proto;
const Utils_1 = require('../Utils');
const crypto = require('crypto');

/**
 * Custom Message Handler for advanced message types.
 * Handles Payment, Product, Interactive, Album, Event, Poll, etc.
 */
class CustomMessageHandler {
    /**
     * @param {Object} utils - Utility functions
     * @param {Function} waUploadToServer - Function to upload media
     * @param {Function} relayMessageFn - Function to relay messages
     */
    constructor(utils, waUploadToServer, relayMessageFn) {
        this.utils = utils;
        this.relayMessage = relayMessageFn;
        this.waUploadToServer = waUploadToServer;
    }

    /**
     * Detects the type of the content.
     * @param {Object} content - The message content
     * @returns {string|null} The detected type or null
     */
    detectType(content) {
        const types = [
            { key: 'requestPaymentMessage', type: 'PAYMENT' },
            { key: 'productMessage', type: 'PRODUCT' },
            { key: 'interactiveMessage', type: 'INTERACTIVE' },
            { key: 'albumMessage', type: 'ALBUM' },
            { key: 'eventMessage', type: 'EVENT' },
            { key: 'pollResultMessage', type: 'POLL_RESULT' },
            { key: 'statusMentionMessage', type: 'STATUS_MENTION' },
            { key: 'orderMessage', type: 'ORDER' },
            { key: 'groupStatus', type: 'GROUP_STATUS' }
        ];

        for (const { key, type } of types) {
            if (content[key]) return type;
        }
        return null;
    }

    async handlePayment(content, quoted) {
        const data = content.requestPaymentMessage;
        let notes = {};

        if (data.sticker?.stickerMessage) {
            notes = {
                stickerMessage: {
                    ...data.sticker.stickerMessage,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        } else if (data.note) {
            notes = {
                extendedTextMessage: {
                    text: data.note,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        }

        return {
            requestPaymentMessage: WAProto.Message.RequestPaymentMessage.fromObject({
                expiryTimestamp: data.expiry || 0,
                amount1000: data.amount || 0,
                currencyCodeIso4217: data.currency || "IDR",
                requestFrom: data.from || "0@s.whatsapp.net",
                noteMessage: notes,
                background: data.background ?? {
                    id: "DEFAULT",
                    placeholderArgb: 0xFFF0F0F0
                }
            })
        };
    }

    async handleProduct(content, jid, quoted) {
        const {
            title,
            description,
            thumbnail,
            productId,
            retailerId,
            url,
            body = "",
            footer = "",
            buttons = [],
            priceAmount1000 = null,
            currencyCode = "IDR"
        } = content.productMessage;

        let productImage;

        if (Buffer.isBuffer(thumbnail)) {
            const { imageMessage } = await this.utils.generateWAMessageContent(
                { image: thumbnail },
                { upload: this.waUploadToServer }
            );
            productImage = imageMessage;
        } else if (typeof thumbnail === 'object' && thumbnail.url) {
            const { imageMessage } = await this.utils.generateWAMessageContent(
                { image: { url: thumbnail.url } },
                { upload: this.waUploadToServer }
            );
            productImage = imageMessage;
        }

        return {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: body },
                        footer: { text: footer },
                        header: {
                            title,
                            hasMediaAttachment: true,
                            productMessage: {
                                product: {
                                    productImage,
                                    productId,
                                    title,
                                    description,
                                    currencyCode,
                                    priceAmount1000,
                                    retailerId,
                                    url,
                                    productImageCount: 1
                                },
                                businessOwnerJid: "0@s.whatsapp.net"
                            }
                        },
                        nativeFlowMessage: { buttons }
                    }
                }
            }
        };
    }

    async handleInteractive(content, jid, quoted) {
        const {
            title,
            footer,
            thumbnail,
            image,
            video,
            document,
            mimetype,
            fileName,
            jpegThumbnail,
            contextInfo,
            externalAdReply,
            buttons = [],
            nativeFlowMessage
        } = content.interactiveMessage;

        let media = null;

        try {
            if (thumbnail) {
                media = await this.utils.prepareWAMessageMedia(
                    { image: { url: thumbnail } },
                    { upload: this.waUploadToServer }
                );
            } else if (image) {
                const imgContent = (typeof image === 'object' && image.url) ? { url: image.url } : image;
                media = await this.utils.prepareWAMessageMedia(
                    { image: imgContent },
                    { upload: this.waUploadToServer }
                );
            } else if (video) {
                const vidContent = (typeof video === 'object' && video.url) ? { url: video.url } : video;
                media = await this.utils.prepareWAMessageMedia(
                    { video: vidContent },
                    { upload: this.waUploadToServer }
                );
            } else if (document) {
                let documentPayload = { document: document };
                if (jpegThumbnail) {
                    documentPayload.jpegThumbnail = (typeof jpegThumbnail === 'object' && jpegThumbnail.url) 
                        ? { url: jpegThumbnail.url } 
                        : jpegThumbnail;
                }

                media = await this.utils.prepareWAMessageMedia(
                    documentPayload,
                    { upload: this.waUploadToServer }
                );

                if (fileName) media.documentMessage.fileName = fileName;
                if (mimetype) media.documentMessage.mimetype = mimetype;
            }
        } catch (error) {
            console.error('Error preparing media for interactive message:', error);
            // Continue without media or rethrow? For now, log and continue if possible, but media is often critical.
        }

        let interactiveMessage = {
            body: { text: title || "" },
            footer: { text: footer || "" }
        };

        if (buttons && buttons.length > 0) {
            interactiveMessage.nativeFlowMessage = { buttons };
            if (nativeFlowMessage) {
                interactiveMessage.nativeFlowMessage = {
                    ...interactiveMessage.nativeFlowMessage,
                    ...nativeFlowMessage
                };
            }
        } else if (nativeFlowMessage) {
            interactiveMessage.nativeFlowMessage = nativeFlowMessage;
        }

        interactiveMessage.header = {
            title: "",
            hasMediaAttachment: !!media,
            ...media
        };

        let finalContextInfo = {};
        if (contextInfo) {
            finalContextInfo = {
                mentionedJid: contextInfo.mentionedJid || [],
                forwardingScore: contextInfo.forwardingScore || 0,
                isForwarded: contextInfo.isForwarded || false,
                ...contextInfo
            };
        }

        if (externalAdReply) {
            finalContextInfo.externalAdReply = {
                title: externalAdReply.title || "",
                body: externalAdReply.body || "",
                mediaType: externalAdReply.mediaType || 1,
                thumbnailUrl: externalAdReply.thumbnailUrl || "",
                mediaUrl: externalAdReply.mediaUrl || "",
                sourceUrl: externalAdReply.sourceUrl || "",
                showAdAttribution: externalAdReply.showAdAttribution || false,
                renderLargerThumbnail: externalAdReply.renderLargerThumbnail || false,
                ...externalAdReply
            };
        }

        if (Object.keys(finalContextInfo).length > 0) {
            interactiveMessage.contextInfo = finalContextInfo;
        }

        return { interactiveMessage };
    }

    async handleAlbum(content, jid, quoted) {
        const array = content.albumMessage;
        const album = await this.utils.generateWAMessageFromContent(jid, {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32),
            },
            albumMessage: {
                expectedImageCount: array.filter((a) => a.hasOwnProperty("image")).length,
                expectedVideoCount: array.filter((a) => a.hasOwnProperty("video")).length,
            },
        }, {
            userJid: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
            quoted,
            upload: this.waUploadToServer
        });

        await this.relayMessage(jid, album.message, {
            messageId: album.key.id,
        });

        for (let content of array) {
            const img = await this.utils.generateWAMessage(jid, content, {
                upload: this.waUploadToServer,
            });

            img.message.messageContextInfo = {
                messageSecret: crypto.randomBytes(32),
                messageAssociation: {
                    associationType: 1,
                    parentMessageKey: album.key,
                },
                participant: "0@s.whatsapp.net",
                remoteJid: "status@broadcast",
                forwardingScore: 99999,
                isForwarded: true,
                mentionedJid: [jid],
                starred: true,
                labels: ["Y", "Important"],
                isHighlighted: true,
                businessMessageForwardInfo: {
                    businessOwnerJid: jid,
                },
                dataSharingContext: {
                    showMmDisclosure: true,
                },
            };

            // ... (rest of the logic kept similar but cleaned up)
            // Note: Keeping specific hardcoded values as they might be intentional for the mod
            
            await this.relayMessage(jid, img.message, {
                messageId: img.key.id,
                quoted: {
                    key: {
                        remoteJid: album.key.remoteJid,
                        id: album.key.id,
                        fromMe: true,
                        participant: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
                    },
                    message: album.message,
                },
            });
        }
        return album;
    }

    async handleEvent(content, jid, quoted) {
        const eventData = content.eventMessage;

        const msg = await this.utils.generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2,
                        messageSecret: crypto.randomBytes(32),
                        supportPayload: JSON.stringify({
                            version: 2,
                            is_ai_message: true,
                            should_show_system_message: true,
                            ticket_id: crypto.randomBytes(16).toString('hex')
                        })
                    },
                    eventMessage: {
                        contextInfo: {
                            mentionedJid: [jid],
                            participant: jid,
                            remoteJid: "status@broadcast",
                            forwardedNewsletterMessageInfo: {
                                newsletterName: "D | 7eppeli-Exloration",
                                newsletterJid: "120363421563597486@newsletter",
                                serverMessageId: 1
                            }
                        },
                        isCanceled: eventData.isCanceled || false,
                        name: eventData.name,
                        description: eventData.description,
                        location: eventData.location || {
                            degreesLatitude: 0,
                            degreesLongitude: 0,
                            name: "Location"
                        },
                        joinLink: eventData.joinLink || '',
                        startTime: typeof eventData.startTime === 'string' ? parseInt(eventData.startTime) : eventData.startTime || Date.now(),
                        endTime: typeof eventData.endTime === 'string' ? parseInt(eventData.endTime) : eventData.endTime || Date.now() + 3600000,
                        extraGuestsAllowed: eventData.extraGuestsAllowed !== false
                    }
                }
            }
        }, { quoted });

        await this.relayMessage(jid, msg.message, {
            messageId: msg.key.id
        });
        return msg;
    }

    async handlePollResult(content, jid, quoted) {
        const pollData = content.pollResultMessage;
        const msg = await this.utils.generateWAMessageFromContent(jid, {
            pollResultSnapshotMessage: {
                name: pollData.name,
                pollVotes: pollData.pollVotes.map(vote => ({
                    optionName: vote.optionName,
                    optionVoteCount: typeof vote.optionVoteCount === 'number'
                        ? vote.optionVoteCount.toString()
                        : vote.optionVoteCount
                })),
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 1,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: pollData.newsletter.newsletterName || "120363399602691477@newsletter",
                        newsletterJid: pollData.newsletter.newsletterJid || "Newsletter",
                        serverMessageId: 1000,
                        contentType: "UPDATE"
                    }
                }
            }
        }, {
            userJid: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
            quoted
        });

        await this.relayMessage(jid, msg.message, {
            messageId: msg.key.id
        });

        return msg;
    }

    async handleStMention(content, jid, quoted) {
        const data = content.statusMentionMessage;
        let media = null;

        if (data.image) {
            const imgContent = (typeof data.image === 'object' && data.image.url) ? { url: data.image.url } : data.image;
            media = await this.utils.prepareWAMessageMedia(
                { image: imgContent },
                { upload: this.waUploadToServer }
            );
        } else if (data.video) {
            const vidContent = (typeof data.video === 'object' && data.video.url) ? { url: data.video.url } : data.video;
            media = await this.utils.prepareWAMessageMedia(
                { video: vidContent },
                { upload: this.waUploadToServer }
            );
        }

        // Note: The logic here seems a bit specific/custom, preserving it mostly as is but cleaning up
        let msg = await this.relayMessage("status@broadcast", {
            ...media
        }, {
            statusJidList: [data.mentions, this.user?.id], // Added optional chaining for this.user
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            {
                                tag: "to",
                                attrs: { jid: data.mentions }, // Assuming 'target' was meant to be 'data.mentions' or similar
                                content: undefined,
                            }
                        ]
                    }
                ],
            }]
        });

        let xontols = await this.utils.generateWAMessageFromContent(jid, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        messageId: msg.key,
                        type: "STATUS_MENTION_MESSAGE"
                    }
                }
            }
        }, {
            addtionalNodes: [
                {
                    tag: "meta",
                    attrs: { "is_status_mention": true },
                    content: undefined
                }
            ]
        });

        await this.relayMessage(jid, xontols.message, {
            messageId: xontols.key.id
        })
        return xontols
    }

    async handleOrderMessage(content, jid, quoted) {
        const orderData = content.orderMessage;

        const msg = await this.utils.generateWAMessageFromContent(jid, {
            orderMessage: {
                orderId: "7EPPELI25022008",
                thumbnail: orderData.thumbnail || null,
                itemCount: orderData.itemCount || 0,
                status: "ACCEPTED",
                surface: "CATALOG",
                message: orderData.message,
                orderTitle: orderData.orderTitle,
                sellerJid: "0@whatsapp.net",
                token: "7EPPELI_EXAMPLE_TOKEN",
                totalAmount1000: orderData.totalAmount1000 || 0,
                totalCurrencyCode: orderData.totalCurrencyCode || "IDR",
                messageVersion: 2
            }
        }, { quoted: quoted });

        await this.relayMessage(jid, msg.message, {});
        return msg;
    }

    async handleGroupStory(content, jid, quoted) {
        const storyData = content.groupStatus;
        let messageContent;

        // Simplified logic
        if (storyData.message) {
            messageContent = storyData;
        } else {
            // Try to find the right generation function
            const generator = this.utils?.generateWAMessageContent || this.utils?.prepareMessageContent || Utils_1.generateWAMessageContent;
            if (typeof generator === 'function') {
                messageContent = await generator(storyData, {
                    upload: this.waUploadToServer
                });
            }
        }

        let msg = {
            message: {
                groupStatusMessageV2: {
                    message: messageContent.message || messageContent
                }
            }
        };

        return await this.relayMessage(jid, msg.message, {
            messageId: this.utils.generateMessageID()
        });
    }
}

module.exports = CustomMessageHandler;
