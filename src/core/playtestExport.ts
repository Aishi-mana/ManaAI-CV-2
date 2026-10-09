import {PREVIEW_RULES} from './playtests';
import type {Playtest} from './playtests';

export function playtestText(report:Playtest):string {
 return `Playtest report\nArtifact: ${report.artifactTitle}\nVersion: ${report.version}\nArtifact ID: ${report.artifactId}\nReport ID: ${report.id}\nRecorded: ${report.createdAt}\n\n${report.player} vs ${report.enemy}\nOutcome: ${report.outcome}\nTurns: ${report.turns}\nStarting health: ${report.player} ${report.startingPlayerHealth}; ${report.enemy} ${report.startingEnemyHealth}\nFinal health: ${report.player} ${report.playerHealth}; ${report.enemy} ${report.enemyHealth}\nBasic player damage: ${report.playerAttackDamage}\nEnemy counter damage: ${report.enemyCounterDamage}\n\nNotes\n${report.notes||'No notes recorded.'}\n\nRules\n${PREVIEW_RULES}\n\nRecent battle log (saved entries, up to 40)\n${report.recentLog.join('\n')||'No log entries recorded.'}\n`;
}
