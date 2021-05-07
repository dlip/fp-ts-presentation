import { pipe } from "fp-ts/function";

const basicPipe = pipe(
  1,
  (x) => x + 1,
  (x) => x * 2,
);

console.log(basicPipe);
