
const fs = require('fs');
require('dotenv').config({path: './.env'});
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256');
const { ethers } = require('hardhat');

const UtilsAsync = require('../utils-async');

const deployment_mode = process.env?.DEPLOYMENT_MODE || "dev-local"
const contracts_details = require(`../${deployment_mode}-contracts.json`)
const dexalotToken = require(`../${deployment_mode}-DexalotToken.json`);

const fileBase = 'DD_Battle_TEST-001';
const snapshotCSV = `./scripts/airdrop/data/${fileBase}.csv`;

let snapshot = [];

async function deploy_airdropvesting() {
	let accounts = await ethers.getSigners();

	const start = parseInt((new Date('February 13, 2022 20:00:00').getTime() / 1000).toFixed(0))  // date and time is local
	const cliff = 120                           // unix time, 120 for 2 min
	const duration = 480                        // unix time, 480 for 8 min
	const firstReleasePercentage = 15           // percentage, 15 for 15%

	let userBalanceAndHashes = [];
	let userBalanceHashes = [];

	let snapshotList = await UtilsAsync.loadData(snapshotCSV);

	for (var i=0; i<snapshotList.length; i++) {
		let rec = snapshotList[i]
		var obj = {}
		obj['address'] = rec['address']
		obj['amount'] = rec['amount']
		snapshot.push(obj)
	}

	snapshot.forEach((item, index) => {
		let hash = ethers.utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, item.address, item.amount]);
		let balance = {
			address: item.address,
			balance: item.amount,
			hash: hash,
			proof: '',
			index: index,
		};

		userBalanceHashes.push(hash);
		userBalanceAndHashes.push(balance);
	});

	const merkleTree = new MerkleTree(userBalanceHashes, keccak256, {
		sortLeaves: true,
		sortPairs: true,
	});

	for (let ubh in userBalanceAndHashes) {
		userBalanceAndHashes[ubh].proof = merkleTree.getHexProof(userBalanceAndHashes[ubh].hash);
	}

	// save hashes of airdrops as a json file
	fs.writeFileSync(
		`./scripts/airdrop/data/${deployment_mode}-hashes-${fileBase}-airdrop.json`,
		JSON.stringify(userBalanceAndHashes, 0, 4),
		"utf-8",
		function (err) {
			if (err) return console.log(err);
		}
	);

	const root = merkleTree.getHexRoot();
	console.log('tree root:', root);

	const Portfolio = await ethers.getContractFactory("Portfolio")
	const portfolio = await Portfolio.attach(contracts_details.Portfolio)

	const Airdrop = await ethers.getContractFactory("AirdropVesting");
	const airdropDeployed = await Airdrop.deploy(dexalotToken.address, root, start, cliff, duration, firstReleasePercentage, portfolio.address);
	await airdropDeployed.deployed();

	console.log("Address = ", airdropDeployed.address);
	console.log("Start = ", parseInt(await airdropDeployed.start()))
	console.log("Cliff = ", parseInt(await airdropDeployed.cliff()))
  	console.log("Duration = ", parseInt(await airdropDeployed.duration()))
	console.log("Dexalot Token Address = ", dexalotToken.address)
  	console.log("Portfolio Address = ", portfolio.address)

	fs.writeFileSync(`./scripts/airdrop/${deployment_mode}-airdrop.json`,
		JSON.stringify({ "address": airdropDeployed.address }, 0, 4),
		"utf8",
		function (err) {
			if (err) {
				console.log(err);
			}
		});
}

deploy_airdropvesting()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
