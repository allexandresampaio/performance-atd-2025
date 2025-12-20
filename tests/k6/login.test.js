import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { SharedArray } from 'k6/data';
import { scenario } from 'k6/execution';

// Load the data in the init context using a SharedArray.
const testData = new SharedArray('users', function () {
  return JSON.parse(open('./test-data/users.json'));
});

// Define test options
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<=2000'], // 95th percentile <= 2 seconds
    http_req_failed: ['rate<0.01'] // Less than 1% failure rate
  }
};

// Main test function
export default function () {
  // Get a specific data object for the current VU iteration
  const user = testData[scenario.iterationInTest % testData.length];

  // Create unique email for registration to avoid conflicts
  const uniqueEmail = `${scenario.iterationInTest}_${user.email}`;

  let responseRegister, responseLogin;

  // Group for user registration
  group('Register User', () => {
    responseRegister = http.post(
      'http://localhost:3000/auth/register',
      JSON.stringify({
        email: uniqueEmail,
        password: user.password,
        name: user.name
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

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
    responseLogin = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: uniqueEmail,
        password: user.password
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Check for successful login (status 200)
    check(responseLogin, {
      'Login status is 200': (r) => r.status === 200,
      'Login response has success': (r) => r.json().success === true,
      'Login response has token': (r) => r.json().data && r.json().data.token
    });
  });

  // Sleep before next iteration
  sleep(1);
}