import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

type NetworkError = {
  type: "NetworkError";
  code: number;
};

const networkError404: NetworkError = { type: "NetworkError", code: 404 };

type UserError = {
  type: "UserError";
  description: string;
};

const userErrorInsufficientFunds: UserError = {
  type: "UserError",
  description: "Insufficient funds",
};

type AppError = NetworkError | UserError;

function getBalance(): TE.TaskEither<AppError, number> {
  const ok = false;
  return TE.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        !ok ? reject(networkError404) : setTimeout(() => resolve(50), 5000);
      }),
    (e) => e as AppError
  );
}

function transfer(balance: number): E.Either<AppError, string> {
  console.log("Transfer");
  return balance > 30
    ? E.right("transfer complete")
    : E.left(userErrorInsufficientFunds);
}

function logic(): TE.TaskEither<AppError, string> {
  //Need to "lift" Either to TaskEither
  const transferTE = TE.fromEitherK(transfer);

  return pipe(getBalance(), TE.chain(transferTE));
}

function showError(e: AppError): string {
  switch (e.type) {
    case "NetworkError":
      return `NetworkError ${e.code}`;
    case "UserError":
      return `UserError ${e.description}`;
    default:
      return "";
  }
}

const run = pipe(
  logic(),
  // Fold "lowers" TaskEither into a 2 Tasks that will execute based on success/fail
  TE.fold(
    (e) =>
      T.of(() => {
        console.log("Error");
        console.log(e);
        console.error(showError(e));
        process.exit(1);
      }),
    (result) =>
      T.of(() => {
        console.log("Success");
        console.log(result);
        process.exit(0);
      })
  )
);

console.log("Running app");
run();
