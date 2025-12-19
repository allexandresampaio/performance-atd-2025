import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { SharedArray } from 'k6/data';
import { scenario } from 'k6/execution';

// 1. Load the data in the init context using a SharedArray.
// The open() function reads the file once from the local filesystem.
const testData = new SharedArray('users', function () {
  // Parse the JSON data from the file
  return JSON.parse(open('./test-data/users.json'));
});

//define quais as configuracoes do teste
export const options = {
  vus: 1,
  //duration: '10s',
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(90)<=50', 'p(95)<=60'], //o percentil de 90 tem que ser <= a 2 milissegundos, percentil de 95 <= 3 milissegundos
    http_req_failed: ['rate<0.01'] //nao queremos nenhum erro
  }
};


//os testes de fato
export default function () {

  
  // Get a specific data object for the current VU iteration.
  // scenario.iterationInTest is a unique index for each iteration across all VUs.
  const user = testData[scenario.iterationInTest % testData.length];

  let responseUserLogin, responseViewProducts, responseUserRegister = '';

  group ('Registrando Users Login', () => {
    responseUserRegister = http.post(
      'http://localhost:3000/auth/register',
      JSON.stringify({
        email: `${user.email}`,
        password: `${user.password}`,
        name: `${user.name}`
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  })

  check(responseUserRegister, {
    'status (create user) deve ser igual a 201': (resposta) => resposta.status === 201
  });

  console.log(responseUserRegister.body)
  sleep(1);

  group ('Fazendo Login', () => {
    responseUserLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: `${user.email}`,
        password: `${user.password}`
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  })

  check(responseUserLogin, {
    'status (login) deve ser igual a 200': (resposta) => resposta.status === 200
  });

  //console.log(responseInstructorLogin.body)
  console.log(responseUserLogin.json().data.token);
  const tokenUserLogin = responseUserLogin.json().data.token
  sleep(1);

  group ('Visualizando Produtos', () => {
    responseViewProducts = http.get(
      'http://localhost:3000/products',
      
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenUserLogin}`
        }
      }
    );
  })
  
  console.log(responseViewProducts.body)

  check(responseViewProducts, {
    'status (view products) deve ser igual a 200': (resposta) => resposta.status === 200
  });
  sleep(1);
 }