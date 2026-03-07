// =====================================================
// Financial Context Builder for Voice AI Agent
// =====================================================
// Builds a comprehensive text summary of the consumer's
// financial data to inject into the ElevenLabs Conversational
// AI agent's system prompt as dynamic context.
//
// This allows the agent to answer detailed questions about
// the user's accounts, balances, transactions, rewards,
// and savings pots with accurate, up-to-date information.
// =====================================================

import { MOCK_ACCOUNTS, MOCK_TRANSACTIONS, MOCK_CARDS, WEEKLY_SPENDING, getConsolidatedBalance } from './accounts';
import { REWARDS_ACCOUNTS, REWARDS_OFFERS, getTotalPointsValue, getTotalPoints } from './rewardsAccounts';
import { INITIAL_POTS } from './savingsPots';
import type { SavingsPot } from './savingsPots';

/**
 * Build a comprehensive financial context string for the voice AI agent.
 * This is injected into the agent's system prompt so it can answer
 * detailed questions about the user's financial situation.
 *
 * @param savingsPots - Current savings pots (from context, may differ from INITIAL_POTS)
 * @returns A formatted string containing all financial data
 */
export function buildFinancialContext(savingsPots?: SavingsPot[]): string {
  const pots = savingsPots ?? INITIAL_POTS;
  const consolidatedBalance = getConsolidatedBalance();
  const totalRewardsValue = getTotalPointsValue(REWARDS_ACCOUNTS);
  const totalPoints = getTotalPoints(REWARDS_ACCOUNTS);
  const totalSavings = pots.reduce((sum, p) => sum + p.currentAmount, 0);

  const sections: string[] = [];

  // --- Account Balances ---
  sections.push(`== BANK ACCOUNTS ==
The customer has ${MOCK_ACCOUNTS.length} linked bank accounts with a consolidated balance of $${consolidatedBalance.toFixed(2)}.
${MOCK_ACCOUNTS.map((a) =>
    `- ${a.name} ${a.type} Account (****${a.lastFour}): $${a.balance.toFixed(2)}`
  ).join('\n')}
Note: Credit card balances are liabilities and are subtracted from the consolidated total.`);

  // --- Cards ---
  sections.push(`== CARDS ==
The customer has ${MOCK_CARDS.length} cards:
${MOCK_CARDS.map((c) =>
    `- ${c.name} (${c.type}, ****${c.lastFour}): $${c.balance.toFixed(2)} balance`
  ).join('\n')}`);

  // --- Recent Transactions ---
  sections.push(`== RECENT TRANSACTIONS ==
${MOCK_TRANSACTIONS.map((t) => {
    const sign = t.amount >= 0 ? '+' : '';
    return `- ${t.type}: ${t.description} ${sign}$${Math.abs(t.amount).toFixed(2)}`;
  }).join('\n')}`);

  // --- Weekly Spending Summary ---
  const totalWeeklyIncome = WEEKLY_SPENDING.reduce((s, d) => s + d.income, 0);
  const totalWeeklySpending = WEEKLY_SPENDING.reduce((s, d) => s + d.spending, 0);
  sections.push(`== WEEKLY SPENDING SUMMARY ==
Total weekly income: $${totalWeeklyIncome}
Total weekly spending: $${totalWeeklySpending}
Net: $${totalWeeklyIncome - totalWeeklySpending}
${WEEKLY_SPENDING.map((d) =>
    `- ${d.day}: Income $${d.income}, Spending $${d.spending}`
  ).join('\n')}`);

  // --- Rewards Accounts ---
  sections.push(`== REWARDS & LOYALTY PROGRAMS ==
The customer has ${REWARDS_ACCOUNTS.length} linked rewards programs with a total estimated value of $${totalRewardsValue.toFixed(2)} across ${totalPoints.toLocaleString()} total points/miles.
${REWARDS_ACCOUNTS.map((r) => {
    const cashValue = (r.pointsBalance * r.cashValuePerPoint).toFixed(2);
    return `- ${r.name} (${r.programName}): ${r.pointsBalance.toLocaleString()} ${r.pointsUnit} (~$${cashValue}) | Tier: ${r.tier} | Member since: ${r.memberSince}`;
  }).join('\n')}`);

  // --- Rewards Offers ---
  const activeOffers = REWARDS_OFFERS.filter((o) => o.pointsCost > 0);
  if (activeOffers.length > 0) {
    sections.push(`== AVAILABLE REWARDS OFFERS ==
${activeOffers.map((o) => {
      const account = REWARDS_ACCOUNTS.find((a) => a.id === o.accountId);
      return `- ${o.title} (${account?.name || 'Unknown'}): ${o.description} | Cost: ${o.pointsCost.toLocaleString()} points | Value: $${o.cashValue.toFixed(2)} | Expires: ${o.expiresIn}`;
    }).join('\n')}`);
  }

  // --- Savings Pots ---
  sections.push(`== SAVINGS POTS ==
The customer has ${pots.length} savings pots with a total of $${totalSavings.toFixed(2)} saved.
${pots.map((p) => {
    const progress = p.goalAmount > 0 ? Math.round((p.currentAmount / p.goalAmount) * 100) : 0;
    return `- ${p.name} Pot: $${p.currentAmount.toFixed(2)} / $${p.goalAmount.toFixed(2)} goal (${progress}% complete) | Target: ${p.targetDate}${p.roundupsEnabled ? ` | Round-ups: ${p.roundupMultiplier}x` : ''}${p.recurringEnabled ? ` | Recurring: $${p.recurringAmount.toFixed(2)} ${p.recurringFrequency}` : ''}`;
  }).join('\n')}`);

  // --- Summary ---
  const netWorth = consolidatedBalance + totalSavings + totalRewardsValue;
  sections.push(`== FINANCIAL SUMMARY ==
Consolidated bank balance: $${consolidatedBalance.toFixed(2)}
Total savings pots: $${totalSavings.toFixed(2)}
Total rewards value: $${totalRewardsValue.toFixed(2)}
Estimated net worth (bank + savings + rewards): $${netWorth.toFixed(2)}`);

  return sections.join('\n\n');
}

/**
 * Build the system prompt override for the voice AI agent.
 * Combines a role instruction with the user's financial data.
 */
export function buildAgentSystemPrompt(savingsPots?: SavingsPot[]): string {
  const financialData = buildFinancialContext(savingsPots);
  return `You are an AI Money Manager and financial assistant for a swiftbank customer. You have access to the customer's complete financial data below. Use this data to answer their questions accurately and provide personalized financial advice.

When discussing money amounts, always be precise with the actual numbers from their accounts. If they ask about balances, transactions, rewards, or savings — refer to the real data below.

Be conversational, helpful, and proactive. If you notice opportunities to save money, optimize rewards, or improve their financial health, mention them naturally.

IMPORTANT: The financial data below is the customer's actual current data. Use these exact numbers when answering questions.

${financialData}`;
}

/**
 * Build a personalized first message for the voice agent.
 */
export function buildAgentFirstMessage(): string {
  const balance = getConsolidatedBalance();
  return `Hi! I'm your AI Money Manager. I can see your accounts are looking good with a consolidated balance of $${balance.toFixed(2)}. What would you like to know about your finances today?`;
}
