/**
 * Currency utility functions for consistent money calculations.
 * Converts between decimal amounts and integer cents to avoid floating-point errors.
 */

const toCents = (amount) => Math.round(Number(amount) * 100);

const fromCents = (amountInCents) => amountInCents / 100;

module.exports = { toCents, fromCents };
