const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

const backupsDir = '/usr/src/app/assets/backups';

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
}

/**
 * Get all backup files from the backups directory
 */
function getAvailableBackups() {
    try {
        const files = fs.readdirSync(backupsDir).filter(file => file.endsWith('.json'));
        return files.map(file => ({
            name: file.replace('.json', ''),
            path: path.join(backupsDir, file)
        }));
    } catch (error) {
        console.error('Error reading backups directory:', error);
        return [];
    }
}

/**
 * Create a new backup of role colors
 */
async function backupRoleColors(guild) {
    try {
        const roles = await guild.roles.fetch();
        const backupData = {
            guildId: guild.id,
            guildName: guild.name,
            timestamp: new Date().toISOString(),
            backupType: 'roleColors',
            roles: roles
                .filter(role => !role.managed && role.id !== guild.id) // Exclude @everyone and managed roles
                .map(role => {
                    const roleData = {
                        id: role.id,
                        name: role.name,
                        position: role.position,
                        color: role.color
                    };
                    
                    // Backup gradient colors if available
                    if (role.unicodeEmoji) {
                        roleData.unicodeEmoji = role.unicodeEmoji;
                    }
                    
                    // Store color type info for better restoration
                    if (role.color === null || role.color === 0) {
                        roleData.colorType = 'default';
                    } else {
                        roleData.colorType = 'solid';
                    }
                    
                    return roleData;
                })
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupFileName = `rolecolors_${timestamp}.json`;
        const backupPath = path.join(backupsDir, backupFileName);

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        return {
            success: true,
            backupName: backupFileName.replace('.json', ''),
            message: `✅ Created backup: **${backupFileName.replace('.json', '')}**`
        };
    } catch (error) {
        console.error('Error creating backup:', error);
        return {
            success: false,
            message: `❌ Error creating backup: ${error.message}`
        };
    }
}

/**
 * Restore role colors from a backup
 */
async function restoreRoleColors(guild, backupName) {
    try {
        const backupPath = path.join(backupsDir, `${backupName}.json`);

        if (!fs.existsSync(backupPath)) {
            return {
                success: false,
                message: `❌ Backup not found: **${backupName}**`
            };
        }

        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

        if (backupData.backupType !== 'roleColors') {
            return {
                success: false,
                message: `❌ Invalid backup type. Expected roleColors, got ${backupData.backupType}`
            };
        }

        let restored = 0;
        let failed = 0;

        for (const roleData of backupData.roles) {
            try {
                const role = await guild.roles.fetch(roleData.id);
                if (role && !role.managed) {
                    const colorOptions = {};
                    
                    // Handle solid colors
                    if (roleData.color) {
                        colorOptions.color = roleData.color;
                    }
                    
                    // Handle unicode emoji for gradient/holographic colors
                    if (roleData.unicodeEmoji) {
                        colorOptions.unicodeEmoji = roleData.unicodeEmoji;
                    }
                    
                    // Apply color settings
                    if (roleData.colorType === 'default') {
                        await role.setColor(null); // Reset to default
                    } else {
                        await role.edit(colorOptions);
                    }
                    
                    restored++;
                }
            } catch (error) {
                console.error(`Failed to restore role ${roleData.id}:`, error);
                failed++;
            }
        }

        return {
            success: true,
            restored,
            failed,
            message: `✅ Restored **${restored}** role colors${failed > 0 ? ` (${failed} failed)` : ''} from **${backupName}**`
        };
    } catch (error) {
        console.error('Error restoring backup:', error);
        return {
            success: false,
            message: `❌ Error restoring backup: ${error.message}`
        };
    }
}

module.exports = {
    name: 'backup',
    description: 'DEV ONLY! Manage server backups.',
    devOnly: true,
    options: [
        {
            name: 'backup_type',
            description: 'Select what to backup',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: '🎨 Role Colors', value: 'roleColors' }
            ]
        },
        {
            name: 'action',
            description: 'Create new or restore from previous backup',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: '💾 Create New Backup', value: 'new' },
                { name: '♻️ Restore Previous Backup', value: 'restore' }
            ]
        },
        {
            name: 'backup_name',
            description: 'Backup name to restore from (if restoring)',
            required: false,
            type: ApplicationCommandOptionType.String,
            autocomplete: true
        }
    ],

    callback: async (client, interaction) => {
        const member = interaction.member;
        const guild = interaction.guild;
        const backupType = interaction.options.getString('backup_type');
        const action = interaction.options.getString('action');
        const backupName = interaction.options.getString('backup_name');

        // Defer the reply as this might take a while
        await interaction.deferReply({ ephemeral: true });

        let result;

        if (action === 'new') {
            // Create new backup
            if (backupType === 'roleColors') {
                result = await backupRoleColors(guild);
            }
        } else if (action === 'restore') {
            // Restore from backup
            if (!backupName) {
                return await interaction.editReply({
                    content: '❌ Please specify a backup name to restore from.'
                });
            }

            if (backupType === 'roleColors') {
                result = await restoreRoleColors(guild, backupName);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(action === 'new' ? '💾 Backup Created' : '♻️ Backup Restored')
            .setDescription(result.message)
            .setColor(result.success ? 'Green' : 'Red')
            .setFooter({ text: `Guild: ${guild.name}` })
            .setTimestamp();

        if (result.restored !== undefined) {
            embed.addFields(
                { name: 'Restored', value: `${result.restored}`, inline: true },
                { name: 'Failed', value: `${result.failed}`, inline: true }
            );
        }

        await interaction.editReply({ embeds: [embed] });
    },

    // Autocomplete handler for backup names
    autocomplete: async (interaction) => {
        try {
            const focusedOption = interaction.options.getFocused(true);

            if (focusedOption.name === 'backup_name') {
                const backups = getAvailableBackups();
                const choices = backups.map(backup => ({
                    name: backup.name,
                    value: backup.name
                })).slice(0, 25); // Discord limit is 25

                await interaction.respond(choices);
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            await interaction.respond([]).catch(() => {}); // Respond with empty array if error
        }
    }
};
