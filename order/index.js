const md5 = require('md5');
const lognormal = require("../lognormal/index.js");
const constant = require("../constant/index.js");
const network = require("../network/index.js");
const secret = require("../constant/secrets.js");


function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
} 

function signMessage(volume, price, market, side){
    let message = `amount=${volume}&api_key=${secret.API_Key}&isfee=0&market=${market}&price=${price}&side=${side}&secret_key=${secret.Secret}`;
    return md5(message).toUpperCase();
}

function signMessageForPending(market){
    let message = `api_key=${secret.API_Key}&limit=10&market=${market}&offset=0&secret_key=${secret.Secret}`;
    return md5(message).toUpperCase();
}

async function getPending(market) {
    try {
        let signedMessage = signMessageForPending(market);
        console.log(signMessage);
        let pending = await network.executePending(signedMessage, market);
        return pending;
    } catch(err) {
        console.error("Error message(Pending) " + err);

    }
}


function signMessageForCanceing(market, id){
    let message = `api_key=${secret.API_Key}&market=${market}&order_id=${id}&secret_key=${secret.Secret}`;
    return md5(message).toUpperCase();
}

async function cancelOrder(market, id) {
    try {
        let signedMessage = signMessageForCanceing(market, id);
        console.log(signMessage);
        let pending = await network.executeCanceling(signedMessage, market, id);
        //console.log(pending.result.PTAUSDT.records);
        return pending;
    } catch(err) {
        console.error("Error message(Pending) " + err);

    }
}


async function placeOrder(volumePTAUSDT, volumePTABTC, paused) {
    try {
        //USDT pair
        let price = await  network.executeBookOrder("PTA/USDT", 1, 1);
        let len = price.length - 2;
        let ranNumber = Math.floor((Math.random()*7)+1);
        price = parseFloat(price) - (ranNumber / Math.pow(10, (len)));
        price = price.toFixed(len);
        let side = 1;
        let market = constant.Market_PTAUSDT;
        let signedMessag = signMessage(volumePTAUSDT, price, market, side);

        let order = await network.executeOrder(signedMessag, volumePTAUSDT, price, market, side);
       
        await sleep(paused/10);
        

        side = 2;
        signedMessag = signMessage(volumePTAUSDT, price, market, side);
        order = await network.executeOrder(signedMessag, volumePTAUSDT, price, market, side);
        await sleep(paused/2);

        //The below is for BTC
        
        price = await network.executeBookOrder("PTA/BTC", 1, 1);
        len = price.length - 2;
        ranNumber = Math.floor((Math.random()*9)+1);
        price = parseFloat(price) - (ranNumber / Math.pow(10, (len)));
        price = price.toFixed(len);
        side = 1;
        market = constant.Market_PTABTC;
        signedMessag = signMessage(volumePTABTC, price, market, side);
        order = await network.executeOrder(signedMessag, volumePTABTC, price, market, side);
        await sleep(paused/10);


        side = 2;
        signedMessag = signMessage(volumePTABTC, price, market, side);
        order = await network.executeOrder(signedMessag, volumePTABTC, price, market, side);

    } catch(err) {
        console.error("Error message" + err);

    }
}

async function orderLoop(pause, dailyVolume){
    let volumePerHour = (dailyVolume*3) / 6;
    const StandardDeviation = 700;

    while(true) {
        let arrayUSDTVariables = lognormal.lognormal(volumePerHour, StandardDeviation);
        let arrayBTCVariables = lognormal.lognormal(volumePerHour, StandardDeviation);
        for(let i = 0; i <= 24; i++) {
            let sellPTAUSDTVolume = arrayUSDTVariables[i];
            let sellPTABTCVolume = arrayBTCVariables[i];
            try {
                // place sell order, and check that it was successful
                let buyExecuted = await placeOrder(Math.ceil(sellPTAUSDTVolume), Math.ceil(sellPTABTCVolume), pause);
            } catch(err) {
                console.error(err);
            }
        }
        await sleep(pause*2);

        let pending = await getPending("PTA/USDT");
        //console.log(pending )
        
        //.result.PTAUSDT.records;
        if(pending.result.PTAUSDT.records) {
            let rslt = await cancelOrder("PTA/USDT", pending.result.PTAUSDT.records[0].id);
           /// console.log(rslt);
        }
    
        pending = await getPending("PTA/BTC")  //.result.PTABTC.records;
        //console.log(pending );
        if(pending.result.PTABTC.records) {
            let rslt = await cancelOrder("PTA/BTC", pending.result.PTABTC.records[0].id);
            //console.log(rslt);
        }
    

    }
}

module.exports = {
    orderLoop: orderLoop
}
//orderLoop(10000, 7000);

//console.log(getPending("PTA/BTC"));

async function foo() {
    let pending = await getPending("PTA/USDT");
    console.log(pending )
    
    //.result.PTAUSDT.records;
    if(pending.result.PTAUSDT.records) {
        let rslt = await cancelOrder("PTA/USDT", pending.result.PTAUSDT.records[0].id);
        console.log(rslt);
    }

    pending = await getPending("PTA/BTC")  //.result.PTABTC.records;
    console.log(pending );
    if(pending.result.PTABTC.records) {
        let rslt = await cancelOrder("PTA/BTC", pending.result.PTABTC.records[0].id);
        console.log(rslt);
    }

}
console.log(foo());