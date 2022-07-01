export class Transaction {
    account: string;
    valutaDate: string;
    creationDate: string;
    reference: string;
    description: string;
    amount: string;
    currency: string;
    executionDate: string;
    receiverAccount: string;
    receiverName: string;
    message: string;

    constructor(data : string[]) {
        this.account = data[0];
        this.valutaDate = data[1];
        this.creationDate = data[2];
        this.reference = data[3];
        this.description = data[4];
        this.amount = data[5];
        this.currency = data[6];
        this.executionDate = data[7];
        this.receiverAccount = data[8];
        this.receiverName = data[9];
        this.message = data[10];
    }
}

export class DataRow {
    account: string;
    name: string;
    amount: number;

    constructor(account: string, name: string, amount: number) {
        this.account = account;
        this.name = name;
        this.amount = amount;
    }
}

export function parseData(json: Array<string>[]): Transaction[] {
    json.shift() // Removes first item
    return json.map(arr => {
        return new Transaction(arr);
    });
}

export function parseAmount(amount: string): number {
    return +amount?.replace(",", "")
}

export function formatAmount(amount: number, hasPrefix: boolean): string {
    const value = (Math.round(amount * 100) / 100)
    let prefix: string = "";
    let formattedAmount = 0;
    if (value < 0) {
        if (hasPrefix) prefix = "-"
        formattedAmount = Math.abs(value)
    } else {
        if (hasPrefix) prefix = "+"
        formattedAmount = value
    }
    return prefix + formattedAmount.toFixed(2)
}