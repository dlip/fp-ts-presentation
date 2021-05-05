import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

type NetworkError = {
    type: "NetworkError",
    code: number,
}

type UserError = {
    type: "UserError",
    description: string,
}

type AppError = NetworkError | UserError;

function getBalance(): E.Either<AppError, number> {
    const ok = true;
    return ok ? E.right(40)
        : E.left({ type: "NetworkError", code: 404 });
}

function transfer(balance: number): E.Either<AppError, string> {
    return balance > 50 ?
        E.right("transfer complete") :
        E.left({ type: "UserError", description: "Insufficient funds" });
}

function logic(): E.Either<AppError, string> {
    return pipe(
        getBalance(),
        E.chain(transfer),
    );
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

pipe(
    logic(),
    E.fold(
        (e) => {
            console.error(showError(e));
            process.exit(1);
        },
        (result) => {
            console.log(result);
            process.exit(0);
        }

    )
)
