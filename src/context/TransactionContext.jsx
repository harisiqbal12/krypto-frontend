import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
	const provider = new ethers.providers.Web3Provider(ethereum);
	const signer = provider.getSigner();
	const transactionContract = new ethers.Contract(
		contractAddress,
		contractABI,
		signer
	);

	return transactionContract;
};

export const TransactionProvider = ({ children }) => {
	const [currentAccount, setCurrentAccount] = useState(null);
	const [loading, setLoading] = useState(false);
	const [transactionCount, setTransactionCount] = useState(
		localStorage.getItem('transactionCount')
	);
	const [formData, setFormData] = useState({
		addressTo: '',
		amount: '',
		keyword: '',
		message: '',
	});

	const handleSignin = async () => {
		if (!ethereum) alert('Install Metamask');

		const accounts = await ethereum.request({ method: 'eth_accounts' });
		if (accounts.length) {
			setCurrentAccount(accounts[0]);
		}

		console.log(accounts);
	};

	const handleChange = prop => event => {
		setFormData({ ...formData, [prop]: event.target.value });
	};

	const sendTransaction = async () => {
		try {
			if (!ethereum) alert('install metamask');
			setLoading(true);

			// get the data from the form
			const { addressTo, amount, keyword, message } = formData;
			const parseAmount = ethers.utils.parseEther(amount);
			if (!parseAmount) throw new Error('Invalid ether value');
			const transactionContract = getEthereumContract();

			await ethereum.request({
				method: 'eth_sendTransaction',
				params: [
					{
						from: currentAccount,
						to: addressTo,
						gas: '0x5208', // hex 21000 GWEI
						value: parseAmount._hex,
					},
				],
			});

			const transationHash = await transactionContract.add(
				addressTo,
				parseAmount,
				message,
				keyword
			);

			console.log(`Loading - ${transationHash.hash}`);
			await transationHash.wait();
			setLoading(false);
			console.log(`success - ${transationHash.hash}`);

			const transationCount = await transactionContract.getTransactionCount();
      setTransactionCount(transationCount);
		} catch (err) {
			console.log(err);
			setLoading(false);
		}
	};

	const connectWallet = async () => {
		try {
			if (!ethereum) alert('Install Metamask');
			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

			setCurrentAccount(accounts[0]);
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		handleSignin();
	}, []);

	return (
		<TransactionContext.Provider
			value={{
				connectWallet,
				currentAccount,
				handleChange,
				formData,
				setFormData,
				sendTransaction,
			}}>
			{children}
		</TransactionContext.Provider>
	);
};
