import { draftManagers } from '../data/managers'
import { leagueDraftConfig } from '../data/draftConfig'

export function getHondaManager() {
    return (
        draftManagers.find(
            (manager) =>
                manager.id ===
                leagueDraftConfig.mySlot,
        ) ??
        null
    )
}

export function getHondaManagerName() {
    return (
        getHondaManager()?.name ??
        null
    )
}

export function isHondaManager(
    managerName: string,
) {
    return (
        managerName ===
        getHondaManagerName()
    )
}