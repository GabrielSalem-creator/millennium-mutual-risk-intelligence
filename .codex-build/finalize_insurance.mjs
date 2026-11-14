import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const workspaceDir='/Users/gabrielsalem/Documents/BizOptimizer';
const runtimeModules='/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
process.env.RUNTIME_NODE_MODULES=runtimeModules;
const skillDir='/Users/gabrielsalem/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
const candidatePath=path.join(workspaceDir,'.codex-build/finalizer/candidate.pptx');
const finalPath=path.join(workspaceDir,'presentations/Millennium Mutual Risk Intelligence.pptx');
const receiptPath=path.join(workspaceDir,'.codex-build/finalizer/validation-insurance.json');
const {finalizePresentation}=await import(pathToFileURL(path.join(skillDir,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 explicitTotalSlideCount:19,
 requiredNativeTableOwnerSlides:[],
 requiredNativeChartOwnerSlides:[],
 workspaceDir,candidatePath,finalPath,
 pythonExecutable:'/Users/gabrielsalem/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
 integrityValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 fontPolicy:{basis:'design',families:['Arial']},
 verifyArtifactToolImport:true,
 receiptPath
});
console.log(JSON.stringify(result));
