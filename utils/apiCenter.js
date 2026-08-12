require("dotenv").config()
const axios = require("axios")
const mailer = require("./mailer")
const User = require("../models/user")
const KiteConnect = require("kiteconnect").KiteConnect

const zerodhaInstance = () => {
   return axios.create({
      baseURL: `${process.env.ZERODHA_URL}`
   })
}

const kiteInstance = () => {
   return axios.create({
      baseURL: `${process.env.KITE_URL}`
   })
}

const getCandleData = async (instruments_token, interval) => {
   console.log(new Date().getTime())
   let toDate = new Date()
   let formDateForHour = new Date()
   let formDateForMinute = new Date()
   formDateForHour.setTime(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
   formDateForMinute.setTime(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
   formDateForHour = formDateForHour.toISOString().split("T")[0]
   formDateForMinute = formDateForMinute.toISOString().split("T")[0]
   toDate = new Date().toISOString().split("T")[0]

   const newInstance = zerodhaInstance()
   try {
      const user = await User.findOne({ name: "admin" })
      let enc_token = user.brokerDetail.enctoken
      const response = await newInstance.get(
         `/oms/instruments/historical/${instruments_token}/${interval}?user_id=${process.env.KITE_USER_ID}&oi=1&from=${
            interval === "minute" ? formDateForMinute : formDateForHour
         }&to=${toDate}`,
         {
            headers: {
               Authorization: `enctoken ${enc_token}`
            }
         }
      )

      return response.data.data.candles
   } catch (error) {
      mailer.sendMail("something went wrong")
      console.log(error)
   }
}

const getMinutesMain = async (inst_token) => {
   const response = await getCandleData(inst_token, "minute")
   return response
}
const getHoursMain = async (inst_token) => {
   const response = await getCandleData(inst_token, "60minute")
   return response
}

const getLatestClose = async (inst_token) => {
   const response = await getMinutesMain(inst_token)
   const price = response?.slice(-1)[0][4]
   return price
}

const orderHistoryThroughApi = async (api_key, access_token, id) => {
   const newInstance = kiteInstance()

   try {
      // console.log(access_token);

      const response = await newInstance.get(`/orders/${id}`, {
         headers: {
            "X-Kite-Version": process.env.KITE_VERSION,
            Authorization: `token ${api_key}:${access_token}`,
            "Content-Type": "application/x-www-form-urlencoded"
         }
      })
      // console.log(response);
      if (response) {
         return response.data.data
      }
   } catch (error) {
      // console.log(error)
   }
}

const orderCheckingHandler = (order_id, api_key, access_token) => {
   let orderStatus
   return new Promise((resolve, reject) => {
      const orderChecking = setInterval(() => {
         orderHistoryThroughApi(api_key, access_token, order_id)
            .then((res) => {
               // console.log(res);
               let status = res?.slice(-1)[0]?.status
               console.log(status)
               if (status === "COMPLETE" || status === "CANCELLED" || status === "REJECTED") {
                  resolve(status)
                  clearInterval(orderChecking)
               } else {
                  orderStatus = status
               }
            })
            .catch((err) => {
               console.log(err)
            })

         console.log("checking")
      }, 5000)

      setTimeout(() => {
         clearInterval(orderChecking)
         resolve(orderStatus)
      }, 65000)
   })
}

const getPositions = async (api_key, access_token) => {
   const newInstance = kiteInstance()

   try {
      const response = await newInstance.get("/portfolio/positions", {
         headers: {
            "X-Kite-Version": process.env.KITE_VERSION,
            Authorization: `token ${api_key}:${access_token}`,
            "Content-Type": "application/x-www-form-urlencoded"
         }
      })
      if (response) {
         return response.data.data
      }
   } catch (error) {
      // console.log(error);
      return { error: "An error occurred while getting positions" }
   }
}

const getInstruments = async () => {
   try {
      const user = await User.findOne({ name: "admin" })
      const apiKey = user.brokerDetail.apiKey
      const kc = new KiteConnect({
         api_key: apiKey
      })

      const AllInstrument = await kc.getInstruments()
      if (AllInstrument.length > 0) {
         const instruments = AllInstrument.filter(
            (instrument) =>
               instrument.tradingsymbol &&
               (instrument.tradingsymbol.startsWith("BANKNIFTY") ||
                  instrument.tradingsymbol.startsWith("NIFTY") ||
                  instrument.tradingsymbol.startsWith("CRUDEOILM")) &&
               instrument.instrument_type === "FUT"
         )
         return instruments
      } else {
         return "Didn't got instruments"
      }
   } catch (error) {
      console.error(error)
      return "error"
   }
}

const getQuantity = async (tradingsymbol, api_key, access_token) => {
   const positions = await getPositions(api_key, access_token)
   if (positions?.error) {
      return positions
   }
   for (let i = 0; i < positions.net.length; i++) {
      if (positions.net[i].tradingsymbol === tradingsymbol) {
         return positions.net[i].quantity
      }
   }
   return 0
}

module.exports = {
   getCandleData,
   getMinutesMain,
   getHoursMain,
   getLatestClose,
   orderHistoryThroughApi,
   orderCheckingHandler,
   getPositions,
   getInstruments,
   getQuantity
}
