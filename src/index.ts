import './index.css'
import World from './world'

async function main() {
    const world = new World()
    try {
        await world.initAsync()
    } catch (e) {
        console.log('Async ressource loading error :')
        console.log(e)
    }
    world.render()
}

main().catch(e => console.log(e))