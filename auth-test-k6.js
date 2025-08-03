//carga y rendimiento
import http from 'k6/http';
import { check, sleep } from 'k6';
//configuración del test
export let options = {
    stages: [
        //calentamiento
        { duration: '5s', target: 5 }, // calentamiento a 5 usuarios en 5 segundos
        { duration: '15s', target: 20 }, // Carga sostenida a 20 usuarios en 15 segundos
        { duration: '5s', target: 0 }, // Enfriamiento a 0 usuarios en 5 segundos
    ],
    //limitaciones
    thresholds: {
        http_req_duration: ['p(95)<600'], // 95% de las peticiones deben responder en menos de 600ms
        http_req_failed: ['rate<0.05'], // Menos del 5% de las peticiones deben fallar
    }
};

//generar correo electrónico único para cada usuario usando el numero de usuario virtual (__VU) y el iterador (__ITER)
function generarCorreo(){
    return `user_${__VU}_${__ITER}@test.com`;
}
//Funcion que se ejecuta por cada usuario virtual en cada iteración
export default function () {
    //1. generar los datos unicos para cada usuario
    const correo = generarCorreo();
    const contrasenia = '12345';
    //2. intentar registar el usuario
    let resRegister = http.post('http://localhost:3000/api/auth/register', JSON.stringify({
        correo: correo,
        contraseña: contrasenia,
    }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    //verificar que la respuesta sea un 201
    check(resRegister, {
        'Registro exitoso': (res) => res.status === 201,
    });

    //3. Realizar el login con el usuario registrado en la misma iteración
    let resLogin = http.post('http://localhost:3000/api/auth/login', JSON.stringify({
        correo: correo,
        contraseña: contrasenia,
    }), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    //verificar que la respuesta del login funcione y devuelva un token
    check(resLogin, {
        'Login exitoso': (res) => res.status === 200 && res.json('token') !== undefined,
        'token presente': (res => !!res.json('token')),
    });
    //4. Esperar un segundo ants de repetir
    sleep(1);
}

