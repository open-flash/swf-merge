import { Incident } from "incident";

async function main(): Promise<void> {
  throw new Incident("NotImplemented");
}

main()
  .catch((err: Error): never => {
    console.error(err.stack);
    return process.exit(1) as never;
  });
