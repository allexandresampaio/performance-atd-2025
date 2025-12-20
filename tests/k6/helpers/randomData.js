export function randomEmail() {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let email = '';
  
  for (let i = 0; i < 10; i++) {
    email += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  email += '@example.com';
  return email;
}

export function randomName() {
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Helen', 'Ian', 'Julia'];
  const lastNames = ['Johnson', 'Brown', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris', 'Ingram', 'Jackson', 'King'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}

export function randomPassword() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return password;
}
