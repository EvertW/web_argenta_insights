import type {NextPage} from 'next'
import React, {MouseEventHandler, useState} from "react";
import Head from 'next/head'
import * as XLSX from 'xlsx';
import {DataRow, formatAmount, parseAmount, parseData, Transaction} from "../lib/models/models";
import {DataRows, TransactionRows} from "../components/rows";
import {Chart as ChartJS, registerables} from 'chart.js';
import {Bar} from 'react-chartjs-2';
import useTranslation from 'next-translate/useTranslation';
import Link from "next/link";
import {useRouter} from "next/router";

const Home: NextPage = () => {
    const {locale} = useRouter();
    const {t} = useTranslation('loc');

    const [fileData, setFileData] = useState<Transaction[]>([]);

    function clearData() {
        setFileData([])
    }

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files) {
            const reader = new FileReader();
            reader.onload = (fileEvent) => {
                const data = fileEvent.target?.result!!;
                const workbook = XLSX.read(data, {type: "array"});
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    dateNF: 'dd-mm-yyyy',
                    rawNumbers: false,
                    header: 1,
                });
                const parsedData = parseData(json as Array<string>[])
                console.log(parsedData);
                setFileData(parsedData);
            };
            reader.readAsArrayBuffer(e.target.files[0]);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-100">
            <Head>
                <title>{t('title')}</title>
                <link rel="icon" href="/favicon.svg"/>
            </Head>

            <main className="flex flex-wrap w-full items-center justify-center ">
                <div className="flex flex-wrap bg-green-600 w-full px-12 py-8 w-full justify-between">
                    <div className="flex flex-wrap">
                        <h1 className="text-2xl font-medium w-full text-white">{t('title')}</h1>
                        <h1 className="w-full text-white font-body text-slate-100">{t('subtitle')}</h1>
                    </div>
                    {
                        <Link href="/" locale={locale == 'nl' ? 'fr' : 'nl'}>
                            <button type="button"
                                    className="focus:outline-none text-white bg-green-700 hover:bg-green-800 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 mt-4 sm:mt-0">
                                {locale == 'nl' ? t('language_fr') : t('language_nl')}
                            </button>
                        </Link>
                    }

                    <div className="flex justify-center items-center w-full mt-4 text-white">
                        <label htmlFor="dropzone-file"
                               className="flex flex-col justify-center items-center w-full rounded-lg border-2 border-white border-dashed cursor-pointer hover:bg-slate-700/20">
                            <div className="flex flex-col justify-center items-center pt-5 pb-6">
                                <svg className="mb-3 w-10 h-10" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                </svg>
                                <p className="mb-2 text-sm "><span
                                    className="font-medium">{t('upload_button_click')}</span>{t('upload_button_drag')}
                                </p>
                                <p className="text-xs text-slate-100">{t('upload_button_file_type')}</p>
                            </div>
                            <input id="dropzone-file" type="file"
                                   onChange={handleFile}
                                   className="hidden"
                                   accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>
                        </label>
                    </div>
                </div>
                <Content data={fileData} clearCallback={clearData}/>
            </main>
        </div>
    )
}

function Content({data, clearCallback}: { data: Array<Transaction>, clearCallback: MouseEventHandler<HTMLButtonElement> }) {
    const {t} = useTranslation('loc');
    if (data.length == 0) return <Instructions/>
    // Calculate income set
    const incomeTransactions = data.filter((value, index, array) => {
        return parseAmount(value.amount) >= 0
    });
    const uniqueIncomeSet = [...new Set(incomeTransactions.map(item => item["receiverName"]))];
    const income: DataRow[] = uniqueIncomeSet.map((value, index, array) => {
        let sum = 0;
        incomeTransactions.forEach((obj) => {
            if (obj["receiverName"] == value) {
                sum += parseAmount(obj.amount);
            }
        });
        const name: string = incomeTransactions.find(transaction => {
            return transaction["receiverName"] == value;
        })?.["receiverAccount"] ?? t('unknown_account');
        return new DataRow(
            name,
            value,
            sum
        )
    }).sort((a, b) => {
        return b.amount - a.amount;
    })
    let incomeTotal = 0
    income.forEach((obj) => {
        incomeTotal += obj.amount;
    });

    // Calculate expenses
    const expenseTransactions = data.filter((value, index, array) => {
        return parseAmount(value.amount) < 0
    });
    const uniqueExpenseSet = [...new Set(expenseTransactions.map(item => item["receiverName"]))];
    const expenses: DataRow[] = uniqueExpenseSet.map((value, index, array) => {
        let sum = 0;
        expenseTransactions.forEach((obj) => {
            if (obj["receiverName"] == value) {
                sum += Math.abs(parseAmount(obj.amount));
            }
        });
        const name: string = expenseTransactions.find(transaction => {
            return transaction["receiverName"] == value;
        })?.["receiverAccount"] ?? t('unknown_account');
        return new DataRow(
            name,
            value,
            sum
        )
    }).sort((a, b) => {
        return b.amount - a.amount;
    })
    let expenseTotal = 0
    expenses.forEach((obj) => {
        expenseTotal += obj.amount;
    });

    // Calculate diff
    const uniqueDiffSet = [...new Set(data.map(item => item["receiverAccount"]))];
    const diff: DataRow[] = uniqueDiffSet.map((value, index, array) => {
        let sum = 0;
        data.forEach((obj) => {
            if (obj["receiverAccount"] == value) {
                sum += parseAmount(obj.amount);
            }
        });
        const uniqueDiffNameSet = [...new Set(data.filter((transaction) => {
            return transaction["receiverAccount"] == value
        }).map(item => item["receiverName"]))];

        let name: string;
        if (uniqueDiffNameSet.length == 1) {
            name = uniqueDiffNameSet[0] ?? t('other');
        } else if (value == null) {
            name = t('other')
        } else {
            name = uniqueDiffNameSet.join(", ");
        }
        return new DataRow(
            value ?? t('unknown_account'),
            name,
            sum
        )
    }).sort((a, b) => {
        return b.amount - a.amount;
    })

    // Determine balance
    const balance = incomeTotal - expenseTotal

    // Determine period
    const startDate = data[data.length - 1].executionDate
    const endDate = data[0].executionDate

    // Determine Graph
    ChartJS.register(...registerables);

    return <div className="px-12 py-8 w-full">
        <div className="flex flex-wrap justify-between">
            <div>
                <h1 className="font-medium">{t('period')}</h1>
                <p className="text-xl">{startDate} {t('period_until')} {endDate}</p>
            </div>

            <button type="button"
                    onClick={clearCallback}
                    className="mt-4 sm:mt-0 py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200">
                {t('clear')}
            </button>

        </div>
        <div className="flex flex-wrap xl:flex-nowrap gap-8 mt-6">
            {/* Income */}
            <div
                className="w-full bg-white rounded-lg border border-gray-200 shadow-md overflow-clip">
                <div className="px-6 pt-6 border-b">
                    <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 ">{t('income_title')}</h5>
                    <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 font-body">{t('income_description')}</p>
                </div>
                <div className="h-auto max-h-96 overflow-auto">
                    <DataRows data={income} prefixed={false}/>
                </div>
                <div className="flex flex-wrap justify-between p-4 border-t">
                    <span className="font-medium text-xl">{t('total')}</span>
                    <span
                        className="font-medium text-xl">{formatAmount(incomeTotal, false)} {t('currency')}</span>
                </div>
            </div>

            {/* Expense */}
            <div
                className="w-full bg-white rounded-lg border border-gray-200 shadow-md overflow-clip">
                <div className="px-6 pt-6 border-b ">
                    <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 ">{t('expenses_title')}</h5>
                    <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 font-body">{t('expenses_description')}</p>
                </div>
                <div className="h-auto max-h-96 overflow-auto">
                    <DataRows data={expenses} prefixed={false}/>
                </div>
                <div className="flex flex-wrap justify-between p-4 border-t">
                    <span className="font-medium text-xl">{t('total')}</span>
                    <span
                        className="font-medium text-xl">{formatAmount(expenseTotal, false)} {t('currency')}</span>
                </div>
            </div>

            {/* Saldo */}
            <div
                className="w-full bg-white rounded-lg border border-gray-200 shadow-md overflow-clip">
                <div className="px-6 pt-6 border-b">
                    <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 ">{t('balance_title')}</h5>
                    <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 font-body">{t('balance_description')}</p>
                </div>
                <div className="h-auto max-h-96 overflow-auto">
                    <DataRows data={diff} prefixed={true}/>
                </div>
                <div className="flex flex-wrap justify-between p-4 border-t">
                    <span className="font-medium text-xl">{t('total_balance')}</span>
                    {
                        balance < 0 ?
                            <span
                                className="text-xl font-medium text-red-500">{formatAmount(balance, true)} {t('currency')}</span>
                            :
                            <span
                                className="text-xl font-medium text-green-500">{formatAmount(balance, true)} {t('currency')}</span>
                    }
                </div>
            </div>
        </div>

        {/* Evolution */}
        <div
            className="mt-8 w-full bg-white rounded-lg border border-gray-200 shadow-md overflow-clip">
            <div className="px-6 pt-6 border-b">
                <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 ">{t('evolution_title')}</h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 font-body">{t('evolution_description')}</p>
            </div>
            <div className="p-8 h-min">
                <Bar
                    data={{
                        labels: data.map(value => {
                            return value.executionDate
                        }).reverse(),
                        datasets: [{
                            data: data.map(value => {
                                return parseAmount(value.amount)
                            }).reverse(),
                            backgroundColor: data.map(value => {
                                if (parseAmount(value.amount) < 0) {
                                    return '#ef4444'
                                } else {
                                    return '#22c55e'
                                }
                            }).reverse(),
                            borderWidth: 0,
                            borderRadius: 6,
                            borderSkipped: false,
                        }]
                    }}
                    className="max-h-96"
                    options={{
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                displayColors: false,
                                backgroundColor: '#000',
                                titleFont: {
                                    family: 'Space Grotesk',
                                },
                                bodyFont: {
                                    family: 'DM Sans',
                                },
                                callbacks: {
                                    label: tooltipItem => {
                                        return formatAmount(parseAmount(tooltipItem.formattedValue), true) + " " + t('currency')
                                    }
                                },
                            },

                        },
                        scales: {
                            x: {
                                grid: {
                                    drawBorder: false,
                                    drawOnChartArea: false,
                                    drawTicks: false,
                                    color: "rgba(0, 0, 0, 0)",
                                },
                                ticks: {
                                    display: false
                                }

                            },
                            y: {
                                grid: {
                                    drawBorder: false,
                                    drawOnChartArea: false,
                                    drawTicks: false
                                },
                                ticks: {
                                    display: false,
                                },
                            }
                        }
                    }
                    }
                />
            </div>
        </div>

        {/* Transactions */}
        <div
            className="mt-8 w-full bg-white rounded-lg border border-gray-200 shadow-md overflow-clip">
            <div className="px-6 pt-6 border-b">
                <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 ">{t('transactions_title')}</h5>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 font-body">{t('transactions_description')}</p>
            </div>
            <div className="h-auto max-h-96 overflow-auto">
                <TransactionRows data={data}/>
            </div>
        </div>
    </div>
}

function Instructions() {
    const {locale} = useRouter();
    const {t} = useTranslation('loc');

    return <div className="w-full flex flex-col items-center py-12 px-12">
        <ol className="relative border-l border-gray-200 dark:border-gray-700">
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-white bg-white font-body text-xl font-medium text-green-800">
                    1
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_login_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 font-body">
                    {t('tutorial_login_description')}<br/>
                    <a className="text-green-800" target="_blank"
                       href={t('tutorial_login_url')}>{t('tutorial_login_url')}</a>
                </p>
            </li>
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-white bg-white font-body text-xl font-medium text-green-800">
                    2
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_account_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 font-body">
                    {t('tutorial_account_description')}
                </p>
            </li>
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-white bg-white font-body text-xl font-medium text-green-800">
                    3
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_download_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                    {t('tutorial_download_description')}
                </p>
                <p className="font-medium text-sm mb-2">{t('example')}</p>
                <img className="w-min border rounded-xl" src={'./tutorial/' + locale + '/download.png'}/>
            </li>
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-white bg-white font-body text-xl font-medium text-green-800">
                    4
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_dates_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                    {t('tutorial_dates_description')}
                </p>
                <p className="font-medium text-sm mb-2">{t('example')}</p>
                <img className="w-min border rounded-xl" src={'./tutorial/' + locale + '/dates.png'}/>
            </li>
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-white bg-white font-body text-xl font-medium text-green-800">
                    5
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_download_transactions_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                    {t('tutorial_download_transactions_description')}
                </p>
                <p className="font-medium text-sm mb-2">{t('example')}</p>
                <img className="w-min border rounded-xl" src={'./tutorial/' + locale + '/download_transactions.png'}/>
            </li>
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-white bg-white font-body text-xl font-medium text-green-800">
                    6
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_upload_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 font-body">
                    {t('tutorial_upload_description')}
                </p>
            </li>
            <li className="mb-10 ml-12">
                <span
                    className="mt-2 flex absolute -left-3 justify-center items-center w-6 h-6 rounded-full ring-8 ring-green-700 bg-green-700 font-body text-xl font-medium text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                </span>
                <h3 className="flex items-center mb-1 text-lg font-medium text-gray-900">
                    {t('tutorial_done_title')}
                </h3>
                <p className="mb-4 text-base font-normal text-gray-500 font-body">
                    {t('tutorial_done_description')}
                </p>
            </li>
        </ol>
    </div>
}

export default Home
