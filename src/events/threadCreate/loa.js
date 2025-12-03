module.exports = async (thread, client) => {
    const forumChannelId = '1435974638902575236';
    if (thread.parentId !== forumChannelId) return;

    const starterMessage = await thread.fetchStarterMessage().catch(() => null);
    if (!starterMessage) return;

    const owner = await thread.fetchOwner().catch(() => null);
    const ownerMention = owner ? `<@${owner.id}>` : 'there';

    const content = starterMessage.content.toLowerCase();
    const requiredFields = ['who:', 'reason:', 'till:'];
    const isValidFormat = requiredFields.every(field => content.includes(field));
    if (!isValidFormat) {
        await thread.send(`## ❌ Denied\nHey, ${ownerMention}! :wave:\nYour **LOA request** is __missing__ required fields. \nPlease include **Who:**, **Reason:**, and **Till:** in the post.`);

        setTimeout(async () => {
            await thread.delete()
        }, 30000);

        return;
    }

    const tags = thread.parent.availableTags;
    const pendingTag = tags.find(tag => tag.name === 'Pending');

    await thread.setAppliedTags([pendingTag.id]);
    await thread.send({
        content: `## 🕐 Pending\nGreetings, ${ownerMention}! 👋\n\nYour **LOA request** has been locked and is now in a pending state. Please allow our **leadership team** to review and approve of your request. This process will take within 24 hours.`,
    });
};