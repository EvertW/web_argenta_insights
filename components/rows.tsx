import React from "react";
import {DataRow, formatAmount, parseAmount, Transaction} from "../lib/models/models";
import useTranslation from "next-translate/useTranslation";

export function DataRows({data, prefixed}: { data: DataRow[], prefixed : boolean }) {
    const {t} = useTranslation('loc');
    return (<div className="w-full divide-y px-6">
            {
                React.Children.toArray(
                    data.map(row => {
                            return <div className="flex flex-wrap justify-between py-4">
                                <div className="flex flex-row justify-between w-full">
                                    <span className="font-body">{row.name}</span>
                                    <span className="font-semibold min-w-fit">{formatAmount(row.amount, prefixed)} {t('currency')}</span>
                                </div>
                                <span className="text-xs w-full text-slate-500">{row.account}</span>
                            </div>
                        }
                    )
                )
            }
        </div>
    )
}

export function TransactionRows({data}: { data: Transaction[] }) {
    const {t} = useTranslation('loc');
    return (<div className="w-full divide-y overflow-auto h-auto px-6">
        {
            React.Children.toArray(
                data.map(transaction => {
                    return <div className="flex flex-wrap justify-between py-4">
                        <span className="text-xs w-full text-slate-500">{transaction.executionDate}</span>
                        <span className="font-body truncate">{transaction["receiverName"]}</span>
                        <span className="font-semibold">{formatAmount(parseAmount(transaction.amount), true)} {t('currency')}</span>
                        <span className="text-xs w-full text-slate-500">{transaction.description}</span>
                    </div>
                    }
                )
            )
        }
    </div>)
}