import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const workspaceDir='/Users/gabrielsalem/Documents/BizOptimizer';
process.env.RUNTIME_NODE_MODULES='/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const skillDir='/Users/gabrielsalem/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
const stagingDir=path.join(workspaceDir,'.codex-build/finalizer');await fs.mkdir(stagingDir,{recursive:true});
const candidatePath=path.join(stagingDir,'candidate.pptx');
await fs.copyFile(path.join(workspaceDir,'deliverables/VDO-X-Human-Behavior-Strategies.pptx'),candidatePath);
const {finalizePresentation}=await import(pathToFileURL(path.join(skillDir,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 explicitTotalSlideCount:11,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
 workspaceDir,candidatePath,finalPath:path.join(workspaceDir,'deliverables/VDO-X-Human-Behavior-Strategies-Validated.pptx'),
 pythonExecutable:'/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
 integrityValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 fontPolicy:{basis:'design',families:['Aptos']},verifyArtifactToolImport:true,
 receiptPath:path.join(stagingDir,'validation-human-behavior.json')
});
console.log(JSON.stringify(result));
