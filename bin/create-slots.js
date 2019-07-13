const Slot = require('../models/Slot');

// create slots
let createSlots = () => {

    // define slot letter, indicator and state
    let slots = [
        {
            slotLetter: 'a',
            indicator: 'green',
            state: 'vacant',
        }, 
        {
            slotLetter: 'b',
            indicator: 'green',
            state: 'vacant',
        },
        {
            slotLetter: 'c',
            indicator: 'green',
            state: 'vacant',
        },
        {
            slotLetter: 'd',
            indicator: 'green',
            state: 'vacant',
        }
    ]
    
    // loop through slots and save to DB
    slots.forEach(slot => {
        Slot.create(slot, (err, newSlot) => {
            console.log('NEW SLOT IS CREATED: ')
            console.log(newSlot);
        })
    })
}

module.exports = createSlots;