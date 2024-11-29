const { PermissionsBitField } = require('discord.js');

/**
 * Checks if a member has the required permissions.
 * @param {GuildMember} member - The member to check.
 * @param {string} permission - The permission to check for.
 * @returns {boolean} True if the member has the permission, false otherwise.
 */
function hasPermission(member, permission) {
    return member.permissions.has(PermissionsBitField.Flags[permission]);
}

module.exports = { hasPermission };
