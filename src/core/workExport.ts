import type {WorkArtifact} from './work';

export function workText(artifact:WorkArtifact):string {
 return `${artifact.title}\nGoal: ${artifact.goalTitle}\nKind: ${artifact.kind}\nVersion: ${artifact.version??1}\nSaved: ${artifact.createdAt}\nGenerated: ${artifact.generatedAt}\nArtifact ID: ${artifact.id}${artifact.parentId?`\nRevises: ${artifact.parentId}`:''}\nStatus: Reviewed draft; not executed or tested.\n\n--- Draft content ---\n${artifact.content}`;
}
