import http from 'k6/http';
import { sleep, check, group } from 'k6';
//import { SharedArray } from 'k6/data';
//import { scenario } from 'k6/execution';
import { randomEmail, randomName, randomPassword } from './helpers/randomData.js';
import { login } from './helpers/loginHelper.js'; 
import { BASE_URL } from './helpers/base_url.js';

import faker from 'k6/x/faker';

//utilizando Trends
import { Trend } from 'k6/metrics';
const postCheckoutDurationTrend = new Trend('post_checkout_duration');//analisando o tempo de resposta do checkout

// // Load the data in the init context using a SharedArray.
// const testData = new SharedArray('users', function () {
//   return JSON.parse(open('./test-data/users.json'));
// });

// Define test options
export const options = {
  vus: 10,
  iterations: 10, //mudei manualmente para ficar menor e não repetir ou zerar estoque
  thresholds: {
    http_req_duration: ['p(95)<=2000'], // 95th percentile <= 2 seconds
    http_req_failed: ['rate<0.01'] // Less than 1% failure rate
  }
};

// Main test function
export default function () {
//   // Get a specific data object for the current VU iteration
//   const user = testData[scenario.iterationInTest % testData.length];

//   // Create unique email for registration to avoid conflicts
//   const uniqueEmail = `${scenario.iterationInTest}_${user.email}`;

  let responseRegister, responseLogin, responseProducts, responseCheckout;
  let token="";
  let user = {
    email: randomEmail(),
    password: faker.internet.password(),
    name: faker.person.firstName()
  };

  // Group for user registration
  group('Register User', () => {
    responseRegister = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' }});

    // Check for successful registration (status 201)
    check(responseRegister, {
      'Register status is 201': (r) => r.status === 201,
      'Register response has success': (r) => r.json().success === true
    });
  });

  // Small sleep between requests
  sleep(1);

  // Group for user login
  group('Login User', () => {
    responseLogin = login(user.email, user.password)
    token = responseLogin.json().data.token;
    // Check for successful login (status 200)
    check(responseLogin, {
        'Login status is 200': (r) => r.status === 200,
        'Login response has success': (r) => r.json().success === true,
        'Login response has token': (r) => r.json().data && r.json().data.token
    });
  });

  // Small sleep between requests
  sleep(1);

  // Group for getting products
  group('Get Products', () => {
    responseProducts = http.get(
      `${BASE_URL}/products`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Check for successful get products (status 200)
    check(responseProducts, {
      'Get Products status is 200': (r) => r.status === 200,
      'Get Products response has success': (r) => r.json().success === true,
      'Get Products has data array': (r) => r.json().data && Array.isArray(r.json().data) && r.json().data.length > 0
    });
  });

  // Small sleep between requests
  sleep(1);

  // Group for checkout
  group('Checkout', () => {
    // Get the first product ID from the products response
    const products = responseProducts.json().data;
    const productId = products[0].id;

    responseCheckout = http.post(
      `${BASE_URL}/checkout`,
      JSON.stringify({
        items: [
          {
            productId: productId,
            quantity: 1
          }
        ],
        paymentMethod: 'cash'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Check for successful checkout (status 200)
    check(responseCheckout, {
      'Checkout status is 200': (r) => r.status === 200,
      'Checkout response has success': (r) => r.json().success === true
    });
  });

  //adicionando informaçãoes na minha Trend para depois ser calculado nos resultados do teste
  postCheckoutDurationTrend.add(responseCheckout.timings.duration);

  // Sleep before next iteration
  sleep(1);
}