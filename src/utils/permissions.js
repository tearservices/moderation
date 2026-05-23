const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('./database');

function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isModerator(member) {
  if (isAdmin(member)) return true;
  const config = getGuildConfig(member.guild.id);
  if (config.mod_role && member.roles.cache.has(config.mod_role)) return true;
  return (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.KickMembers)
  );
}

function canModerate(moderator, target) {
  if (moderator.guild.ownerId === moderator.id) return true;
  if (target.guild?.ownerId === target.id) return false;
  if (!target.roles) return true;
  return moderator.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

module.exports = { isAdmin, isModerator, canModerate };
