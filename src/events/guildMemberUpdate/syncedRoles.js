const leadershipRoles = [
    '1429153661916938271', // Add role names as comments for better readability
    '1429153661417685163',
    '1429153660964962395',
    '1429153648692170843'
];

const staffRoles = [
    '1429153662693015603',
    '1429153663271567391'
];

const LEADERSHIP_TEAM_ROLE = '1429156020403306637';
const STAFF_TEAM_ROLE = '1429156019707183185';

module.exports = async (oldMember, newMember) => {
    // Skip if roles haven't changed
    if (oldMember.roles.cache.size === newMember.roles.cache.size &&
        [...oldMember.roles.cache.keys()].every(role => newMember.roles.cache.has(role))) {
        return;
    }

    try {
        // Check for leadership roles
        const hasLeadershipRole = newMember.roles.cache.some(role => leadershipRoles.includes(role.id));
        const hasLeadershipTeamRole = newMember.roles.cache.has(LEADERSHIP_TEAM_ROLE);

        if (hasLeadershipRole && !hasLeadershipTeamRole) {
            // Add Leadership Team role if they have a leadership role but not the team role
            await newMember.roles.add(LEADERSHIP_TEAM_ROLE);
            console.log(`Added Leadership Team role to ${newMember.user.tag}`);
        } else if (!hasLeadershipRole && hasLeadershipTeamRole) {
            // Remove Leadership Team role if they don't have any leadership roles
            await newMember.roles.remove(LEADERSHIP_TEAM_ROLE);
            console.log(`Removed Leadership Team role from ${newMember.user.tag}`);
        }

        // Check for staff roles
        const hasStaffRole = newMember.roles.cache.some(role => staffRoles.includes(role.id));
        const hasStaffTeamRole = newMember.roles.cache.has(STAFF_TEAM_ROLE);

        if (hasStaffRole && !hasStaffTeamRole) {
            // Add Staff Team role if they have a staff role but not the team role
            await newMember.roles.add(STAFF_TEAM_ROLE);
            console.log(`Added Staff Team role to ${newMember.user.tag}`);
        } else if (!hasStaffRole && hasStaffTeamRole) {
            // Remove Staff Team role if they don't have any staff roles
            await newMember.roles.remove(STAFF_TEAM_ROLE);
            console.log(`Removed Staff Team role from ${newMember.user.tag}`);
        }
    } catch (error) {
        console.error(`Error syncing roles for ${newMember.user.tag}:`, error);
    }
}