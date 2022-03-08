import fs from 'fs/promises'
import * as path from 'path';
import autocannon from 'autocannon'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

( async () => {
    let address = "links.json";

    const _getLinks = async (pathToJSON)=> {
        let fileJSON =  await fs.readFile( path.join(__dirname, pathToJSON), "utf-8");
        return JSON.parse(fileJSON)
    }

    const _startCannon = async ( link, type = 'work' ) => {
       switch (type){
           case "work":
               return await autocannon({
                   url: link,
                   connections: 100, //default
                   pipelining: 4, // default
                   duration: 10, // default
                   workers: 1,
                   excludeErrorStats: true
               })
           case "touch":
               return await autocannon({
                   url: link,
                   connections: 4, //default
                   pipelining: 1, // default
                   duration: 1, // default
                   workers: 1,
                   amount: 6,
                   excludeErrorStats: false
               })
           default:
               return false
       }
    }

    const cannonUrl =  async (httpAddress, type) => {
        try {
            const { duration, statusCodeStats } = await _startCannon (httpAddress, type)

            console.log("duration:", duration, "statusCodeStats:", statusCodeStats)

            if (statusCodeStats && statusCodeStats['200']){
                await cannonUrl(httpAddress, "work")
            }
            return false
        } catch (error) {
            return false
        }
    }

    let arrLinks = await _getLinks(address);

    if (!arrLinks.length){
        throw new Error('wrong file format')
    }

    const start = async () => {
        for (let link of arrLinks) {
            await cannonUrl(link, "touch")
        }
        await start()
    }
    await start()
})()

