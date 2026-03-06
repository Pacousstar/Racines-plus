const fetch = require('node-fetch');
const FormData = require('form-data');

async function createLajorbone() {
    const form = new FormData();
    form.append('email', 'lajorbone.kone@test.com');
    form.append('password', 'Test1234!');
    form.append('firstName', 'Lajorbone');
    form.append('lastName', 'Kone');
    form.append('birthDate', '1995-05-20');
    form.append('gender', 'Homme');
    form.append('villageOrigin', 'Toa-Zéo');
    form.append('quartierNom', 'Gbéya');
    form.append('residenceCountry', 'CI');
    form.append('residenceCity', 'Abidjan');
    form.append('phone1', '+2250700000001');
    form.append('fatherFirstName', 'Moussa');
    form.append('fatherLastName', 'Kone');
    form.append('fatherStatus', 'Vivant');
    form.append('motherFirstName', 'Aminata');
    form.append('motherLastName', 'Kone');
    form.append('motherStatus', 'Vivante');

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            body: form
        });

        const result = await response.json();
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createLajorbone();
