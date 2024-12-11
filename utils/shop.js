const db = require('./database'); // Use your database utility

/**
 * Get the shop items for a server.
 * @param {string} serverId - The Discord server ID.
 * @returns {Promise<Array>} - The list of shop items.
 */
async function getShopItems(serverId) {
    const settings = await db.getServerSettings(serverId);
    return settings.shopItems || [];
}

/**
 * Add a new item to the shop.
 * @param {string} serverId - The Discord server ID.
 * @param {Object} item - The shop item to add.
 * @param {string} item.emoji - The emoji for the item.
 * @param {string} item.name - The name of the item.
 * @param {number} item.price - The price of the item.
 */
async function addShopItem(serverId, item) {
    const settings = await db.getServerSettings(serverId);
    settings.shopItems = settings.shopItems || [];
    settings.shopItems.push(item);
    await db.updateServerSettings(serverId, settings);
}

/**
 * Remove an item from the shop.
 * @param {string} serverId - The Discord server ID.
 * @param {string} itemName - The name of the item to remove.
 */
async function removeShopItem(serverId, itemName) {
    const settings = await db.getServerSettings(serverId);
    settings.shopItems = settings.shopItems.filter(item => item.name.toLowerCase() !== itemName.toLowerCase());
    await db.updateServerSettings(serverId, settings);
}

module.exports = { getShopItems, addShopItem, removeShopItem };
