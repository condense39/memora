import { Project, SyntaxKind, CallExpression } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("d:/projects/CIG_DEV/antigravmemora/memora/app/api/**/route.ts");

for (const sourceFile of project.getSourceFiles()) {
  let changed = false;

  const importDecs = sourceFile.getImportDeclarations();
  const hasApiResponse = importDecs.some(i => i.getModuleSpecifierValue() === "@/lib/api-response");
  if (!hasApiResponse) {
    sourceFile.addImportDeclaration({
      namedImports: ["successResponse", "errorResponse"],
      moduleSpecifier: "@/lib/api-response"
    });
    changed = true;
  }

  let maxIterations = 100;
  while (maxIterations-- > 0) {
    let replaced = false;
    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const call of calls) {
      try {
        const expr = call.getExpression();
        if (expr.getText() === "NextResponse.json") {
          const args = call.getArguments();
          if (args.length === 0) continue;

          const dataArg = args[0];
          let statusArg = "200";

          if (args.length > 1) {
            const initArg = args[1];
            if (initArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
              const prop = initArg.asKind(SyntaxKind.ObjectLiteralExpression)?.getProperty("status");
              if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
                statusArg = prop.asKind(SyntaxKind.PropertyAssignment)?.getInitializer()?.getText() || "200";
              }
            }
          }

          if (dataArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const obj = dataArg.asKind(SyntaxKind.ObjectLiteralExpression)!;
            const errorProp = obj.getProperty("error");
            
            if (errorProp && errorProp.getKind() === SyntaxKind.PropertyAssignment) {
              const init = errorProp.asKind(SyntaxKind.PropertyAssignment)!.getInitializer()!;
              let messageText = init.getText();
              
              if (messageText === "true") {
                const msgProp = obj.getProperty("message");
                if (msgProp && msgProp.getKind() === SyntaxKind.PropertyAssignment) {
                  messageText = msgProp.asKind(SyntaxKind.PropertyAssignment)!.getInitializer()!.getText();
                } else {
                  messageText = '"An error occurred"';
                }
              }
              
              call.replaceWithText(`errorResponse(${messageText}, ${statusArg})`);
              replaced = true;
              changed = true;
              break; // Break the for-loop, re-fetch descendants
            }
          }

          if (args.length > 1) {
            call.replaceWithText(`successResponse(${dataArg.getText()}, ${statusArg})`);
          } else {
            call.replaceWithText(`successResponse(${dataArg.getText()})`);
          }
          replaced = true;
          changed = true;
          break; // Break the for-loop, re-fetch descendants
        }
      } catch (e) {
         // ignore forgotten nodes
      }
    }
    if (!replaced) break;
  }

  if (changed) {
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
