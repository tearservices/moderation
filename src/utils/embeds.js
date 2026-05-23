const { EmbedBuilder } = require('discord.js');

const COLORS = {
  success: 0x57F287,
  error: 0xED4245,
  warn: 0xFEE75C,
  info: 0x5865F2,
  mod: 0xEB459E,
  firefli: 0x6366F1,
  neutral: 0x2F3136,
};

const success = (title, desc) =>
  new EmbedBuilder().setColor(COLORS.success).setTitle(`✅ ${title}`).setDescription(desc).setTimestamp();

const error = (title, desc) =>
  new EmbedBuilder().setColor(COLORS.error).setTitle(`❌ ${title}`).setDescription(desc).setTimestamp();

const warn = (title, desc) =>
  new EmbedBuilder().setColor(COLORS.warn).setTitle(`⚠️ ${title}`).setDescription(desc).setTimestamp();

const info = (title, desc) =>
  new EmbedBuilder().setColor(COLORS.info).setTitle(`ℹ️ ${title}`).setDescription(desc).setTimestamp();

const mod = (title, desc) =>
  new EmbedBuilder().setColor(COLORS.mod).setTitle(`🔨 ${title}`).setDescription(desc).setTimestamp();

const firefli = (title, desc) =>
  new EmbedBuilder().setColor(COLORS.firefli).setTitle(`🔥 ${title}`).setDescription(desc).setTimestamp();

module.exports = { success, error, warn, info, mod, firefli, COLORS };
