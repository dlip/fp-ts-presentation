import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

const NETWORK_ERROR = false;
const NETWORK_WAIT = 3000;
const TRANSFER_AMOUNT = 50;
const BALANCE = 50;

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
  return TE.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        NETWORK_ERROR ? reject(networkError404) : setTimeout(() => resolve(BALANCE), NETWORK_WAIT);
      }),
    (e) => e as AppError
  );
}

function transfer(balance: number): E.Either<AppError, string> {
  return balance >= TRANSFER_AMOUNT
    ? E.right("Transfer complete")
    : E.left(userErrorInsufficientFunds);
}

function logic(): TE.TaskEither<AppError, string> {
  //Need to "lift" Either to TaskEither for it to work with a pipe containing TaskEither
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
  // Fold "lowers" TaskEither into a Task that will execute based on success/fail
  TE.fold(
    // Using fromIO is good practice to show we are performing an unsafe action
    (e) => T.fromIO(() => {
      console.error(showError(e));
      process.exit(1);
    }),
    (result) => T.fromIO(() => {
      console.log(result);
      process.exit(0);
    }),
  )
);

console.log("Running App");
run();
