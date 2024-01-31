import { formatBytes32String } from "ethers/lib/utils";
import { ethers, network, upgrades } from 'hardhat';
import * as f from "../test/MakeTestSuite";
import Utils from "../test/utils";



const ChainId = 43112;
const native = "AVAX";

const tokenAddressMap: any = {};
tokenAddressMap["AVAX"] = "0x0000000000000000000000000000000000000000";

const sellPrices: Array<number> = [];
const buyPrices: Array<number> = [];
const sellIDs: Array<string> = [];
const buyIDs: Array<string> = [];

async function main() {
  const {owner, admin, auctionAdmin, trader1, trader2} = await f.getAccounts()
  const Orderbook = await ethers.getContractFactory("OrderBooks");
  const orderbook = await Orderbook.deploy();
  console.log("orderbook Contract Address:", orderbook.address)

  // 잘은모르지만 Step 따라하기
  /** Order book **/
  const buyBook = formatBytes32String("buyBook")
  const sellBook = formatBytes32String("sellBook")

  const role = await orderbook.EXECUTOR_ROLE()
  await (await orderbook.initialize()).wait()
  await (await orderbook.grantRole(role, owner.address)).wait()

  await (await orderbook.addToOrderbooks(buyBook, 0)).wait() // 0 Mean is Buy
  await (await orderbook.addToOrderbooks(sellBook, 1)).wait()  // 1 Mean is Sell

  const buyOrders = [
      {"orderid": 1, "price": 0.0016},
      {"orderid": 2, "price": 0.0016},
      {"orderid": 3, "price": 0.0016},
      {"orderid": 4, "price": 0.0018},
      {"orderid": 5, "price": 0.0018},
      {"orderid": 6, "price": 0.0019},
      {"orderid": 7, "price": 0.002},
      {"orderid": 8, "price": 0.002},
      {"orderid": 9, "price": 0.002},
      {"orderid": 10, "price": 0.0022},
      {"orderid": 11, "price": 0.0022}
  ]

  const sellOrders = [
      {"orderid": 1, "price": 0.0018},
      {"orderid": 2, "price": 0.0018},
      {"orderid": 3, "price": 0.0018},
      {"orderid": 4, "price": 0.002},
      {"orderid": 5, "price": 0.002},
      {"orderid": 6, "price": 0.002},
      {"orderid": 7, "price": 0.0022},
      {"orderid": 8, "price": 0.0022},
      {"orderid": 9, "price": 0.0022},
      {"orderid": 10, "price": 0.0024},
      {"orderid": 11, "price": 0.0024}
  ]

  for (let i=0; i<buyOrders.length; i++) {
    const buyID = buyOrders[i]["orderid"];
    const priceStr = buyOrders[i]["price"];

    buyIDs[i] = String(buyOrders[i]["orderid"]);
    buyPrices[i] = parseFloat(String(buyOrders[i]["price"]));
    await (await orderbook.addOrder(buyBook, Utils.fromUtf8(buyID.toString()), Utils.toWei(priceStr.toString()))).wait();
    console.log("Buy Order 진행 중")
  }

  for (let i=0; i<sellOrders.length; i++) {
    const sellID = sellOrders[i]["orderid"];
    const priceStr = sellOrders[i]["price"];

    sellIDs[i] = String(sellOrders[i]["orderid"]);
    sellPrices[i] = parseFloat(String(sellOrders[i]["price"]));
    await (await orderbook.addOrder(sellBook, Utils.fromUtf8(sellID.toString()), Utils.toWei(priceStr.toString()))).wait();
    console.log("sell Order 진행 중")
  }

  const tob = await orderbook.nextPrice(sellBook, 1, 0)
  const tob1 = await orderbook.nextPrice(buyBook, 1, 0)

  const bestBid = await orderbook.bestPrice(buyBook);
  const bestAsk = await orderbook.bestPrice(sellBook);
  console.log(`Best Bid: ${Utils.formatUnits(bestBid, 18)}  ::  Best Ask : ${Utils.formatUnits(bestAsk, 18)}`);

  console.log("Sell NextPrice:", tob.toString())
  console.log("Buy NextPrice:", tob1.toString())

  const aa = await orderbook.getTopOfTheBook(buyBook);
  const bb = await orderbook.getTopOfTheBook(sellBook);

  console.log("buy top of Book", aa["0"], aa["1"]) // Price(Best Bid or Best Ask) / Order Id of Best Bid or Best Ask
  console.log("sell top of Book", bb["0"], bb["1"]) // Price(Best Bid or Best Ask) / Order Id of Best Bid or Best Ask

  let orderid = await orderbook.getHead(buyBook, tob1);
  const orders = [];
  orders.push(Utils.toUtf8(orderid));
  orderid = await orderbook.nextOrder(buyBook, tob1, orderid);
  console.log(`Price: ${Utils.formatUnits(tob1, 18)}  ::  Order IDs: ${orders} :: ${orderid}`);

  await (await orderbook.matchTrade(sellBook, Utils.toWei(`${sellPrices[0]}`), 1, 1)).wait()
  await (await orderbook.matchTrade(sellBook, Utils.toWei(`${sellPrices[1]}`), 1, 1)).wait()
  await (await orderbook.matchTrade(sellBook, Utils.toWei(`${sellPrices[2]}`), 1, 1)).wait()


  const buySize = await orderbook.getBookSize(buyBook);
  const sellSize = await orderbook.getBookSize(sellBook);
  console.log(`BuyBookSize: ${buySize}  ::  SellBookSize : ${sellSize}`);

  console.log(`Best Bid: ${Utils.formatUnits(bestBid, 18)}  ::  Best Ask : ${Utils.formatUnits(bestAsk, 18)}`);

  const buyExists = await orderbook.exists(buyBook, Utils.parseUnits('0.002', 18));
  const sellExists = await orderbook.exists(sellBook, Utils.parseUnits('0.002', 18));
  const buyNotExists = await orderbook.exists(buyBook, Utils.parseUnits('0.2', 18));
  const sellNotExists = await orderbook.exists(sellBook, Utils.parseUnits('0.2', 18));
  console.log(`Buy Exists: ${buyExists}  ::  Sell Exists : ${sellExists}`);
  console.log(`Buy Not Exists: ${buyNotExists}  ::  Sell Not Exists : ${sellNotExists}`);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});