const { setupReactionRoleListeners } = require('../commands/reactionroles');

function loadReactionRoleListeners(client) {
    setupReactionRoleListeners(client);
}

module.exports = { loadReactionRoleListeners };
