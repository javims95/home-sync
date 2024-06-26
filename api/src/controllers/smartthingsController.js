const {
    getSmartThingsDevices,
    getDeviceDescription,
    getDeviceStatus,
    turnOnDevice,
    turnOffDevice,
    scheduleSimpleTask,
    cancelSimpleTask,
} = require('../services/smartthingsService')

const conexion = require('../database/conexion')

// Objeto para almacenar las tareas
const taskRegistry = {}

const getDevices = async (req, res) => {
    try {
        const devices = await getSmartThingsDevices()
        res.json(devices)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getDescription = async (req, res) => {
    const { deviceId } = req.params
    try {
        const response = await getDeviceStatus(deviceId)
        res.json(response)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getStatus = async (req, res) => {
    const { deviceId } = req.params
    try {
        const response = await getDeviceStatus(deviceId)
        res.json(response.components.main.switch.switch.value)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const toggleDevice = async (req, res) => {
    const { deviceId } = req.params

    try {
        const response = await getDeviceStatus(deviceId)

        if (
            response &&
            response.components &&
            response.components.main &&
            response.components.main.switch &&
            response.components.main.switch.switch &&
            response.components.main.switch.switch.value
        ) {
            const currentStatus = response.components.main.switch.switch.value

            if (currentStatus === 'on') {
                await turnOffDevice(deviceId)
                res.json({ message: 'Dispositivo apagado' })
            } else if (currentStatus === 'off') {
                await turnOnDevice(deviceId)
                res.json({ message: 'Dispositivo encendido' })
            } else {
                res.status(500).json({
                    message: 'Estado del dispositivo desconocido',
                })
            }
        } else {
            res.status(500).json({
                message: 'Respuesta de SmartThings inesperada',
            })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const turnOn = async (req, res) => {
    const { deviceId } = req.params

    try {
        const response = await turnOnDevice(deviceId)
        res.json(response)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const turnOff = async (req, res) => {
    const { deviceId } = req.params

    try {
        const response = await turnOffDevice(deviceId)
        res.json(response)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// const simpleSchedule = async (req, res) => {
//     const { deviceId, action, delay } = req.body
//     console.log(deviceId, action, delay);
//     try {
//         const taskId = action === 'turnOn' ? await scheduleDeviceOn(deviceId, delay) : await scheduleDeviceOff(deviceId, delay)
//         res.json({
//             message: `Tarea programada para encender el dispositivo ${deviceId} en ${delay} segundos.`,
//             taskId: taskId,
//         })
//     } catch (error) {
//         res.status(500).json({ message: error.message })
//     }
// }

// const simpleSchedule = async (req, res) => {
//     const { deviceId, action, delay } = req.body;

//     try {
//         const taskId = await scheduleSimpleTask(deviceId, action, delay);

//         // Almacenar la referencia del timeout
//         const timeoutId = setTimeout(async () => {
//             try {
//                 if (action === 'turnOn') {
//                     await turnOnDevice(deviceId);
//                 } else if (action === 'turnOff') {
//                     await turnOffDevice(deviceId);
//                 }

//                 // Actualizar el estado de la tarea en la base de datos
//                 const updateSql = 'UPDATE tasks SET status = ? WHERE taskId = ?';
//                 conexion.query(updateSql, ['completed', taskId], (error) => {
//                     if (error) {
//                         console.error('Error al actualizar el estado de la tarea:', error);
//                     }
//                 });

//                 delete taskRegistry[taskId]; // Limpia la referencia una vez ejecutada la tarea
//             } catch (error) {
//                 console.error(error);
//             }
//         }, delay);

//         res.json({
//             message: `Tarea programada para ${action} el dispositivo ${deviceId} en ${delay / 60 / 1000} minutos.`,
//             taskId: taskId,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error al programar la tarea.' });
//     }
// };

const simpleSchedule = async (req, res) => {
    const { deviceId, action, delay } = req.body

    try {
        const taskId = await scheduleSimpleTask(deviceId, action, delay)

        // Almacenar la referencia del timeout
        taskRegistry[taskId] = setTimeout(async () => {
            try {
                if (action === 'turnOn') {
                    await turnOnDevice(deviceId)
                } else if (action === 'turnOff') {
                    await turnOffDevice(deviceId)
                }

                // Actualizar el estado de la tarea en la base de datos
                const updateSql = 'UPDATE tasks SET status = ? WHERE task_id = ?'
                conexion.query(updateSql, ['completed', taskId], (error) => {
                    if (error) {
                        console.error('Error al actualizar el estado de la tarea:', error)
                    }
                })

                delete taskRegistry[taskId] // Limpia la referencia una vez ejecutada la tarea
            } catch (error) {
                console.error(error)
            }
        }, delay)

        res.json({
            message: `Tarea programada para ${action} el dispositivo ${deviceId} en ${delay / 60 / 1000} minutos.`,
            taskId: taskId,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al programar la tarea.' })
    }
}
const cancelTask = async (req, res) => {
    const { taskId } = req.params

    try {
        // Cancelar el setTimeout
        if (taskRegistry[taskId]) {
            clearTimeout(taskRegistry[taskId])
            delete taskRegistry[taskId]
        }

        const result = await cancelSimpleTask(taskId)
        res.json(result)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getDevices,
    getDescription,
    toggleDevice,
    turnOn,
    turnOff,
    getStatus,
    simpleSchedule,
    cancelTask,
}
