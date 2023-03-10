const logo = require("asciiart-logo");
const inquirer = require("inquirer");
const mysql2 = require("mysql2");
const cTable = require("console.table");
const db = require("./config/connection");
require("dotenv").config();


function splashScreen() {
  const longText1 = `*** SQL Challenge ***`;


  console.log(
    logo({
      name: "Employee Tracker",
      lineChars: 10,
      padding: 2,
      margin: 3,

    })
      .emptyLine()
      .right("Version 1.0")
      .emptyLine()
      .center(longText1)
      .emptyLine()
      .render()
  );
  console.log(
    "You are now logged on to the " + process.env.DB_NAME + " database"
  );
  console.log("\n" + "\n");
}
splashScreen();
db.connect(function(err){
  if(err) throw err;
  console.log("SQL connected");

  start();
});

function start(){
  inquirer
      .prompt([
          {
              type: "list",
              name: "start",
              message: "We have information on employees, departments, and employee roles. What would you like to do?",
              choices: ["View", "Add", "Update", "Exit"] 
          }
      ]).then (function(res){
          switch(res.start){
              case "View":
                  view();
                  break;
              case "Add":
                  add();
                  break;
              case "Update":
                  updateEmployee();
              break;
              case "Exit":
                  console.log("-----------------------------------------");
                  console.log("THANK YOU");
                  console.log("-----------------------------------------");
                  break;
              default:
                  console.log("default");
          }
      });
}

function view(){
  inquirer
      .prompt([
          {
              type: "list",
              name: "view",
              message: "Select one to view:", 
              choices: ["All employees", "By department", "By role"]
          }
      ]).then(function(res){
          switch(res.view){
              case "All employees":
                  viewAllEmployees();
                  break;
              case "By department":
                  viewByDepartment();
                  break;
              case "By role":
                  viewByRole();
              default:
                  console.log("default");
          }
      });
}

function viewAllEmployees(){
  db.query("SELECT e.id AS ID, e.first_name AS First, e.last_name AS Last, e.role_id AS Role, r.salary AS Salary, m.last_name AS Manager, d.name AS Department FROM employee e LEFT JOIN employee m ON e.manager_id = m.id LEFT JOIN role r ON e.role_id = r.title LEFT JOIN department d ON r.department_id = d.id", function(err, results){
      if(err) throw err;
      console.table(results);
      start();
  });
}

function viewByDepartment(){
  db.query("SELECT * FROM department", function(err, results){
      if(err) throw err;
      inquirer
          .prompt([
              {
                  name: "choice",
                  type: "rawlist",
                  choices: function(){
                      let choiceArr = [];
                      for(i=0; i< results.length; i++){
                          choiceArr.push(results[i].name);
                      }
                      return choiceArr;
                  },
                  message: "Select department"
              }
          ]).then(function(answer){
              db.query(
                  "SELECT e.id AS ID, e.first_name AS First, e.last_name AS Last, e.role_id AS Role, r.salary AS Salary, m.last_name AS Manager, d.name AS Department FROM employee e LEFT JOIN employee m ON e.manager_id = m.id LEFT JOIN role r ON e.role_id = r.title LEFT JOIN department d ON r.department_id = d.id WHERE d.name =?", [answer.choice], function(err, results){
                      if(err) throw err;
                      console.table(results);
                      start();
                  }
              )
          });
  });

}

function viewByRole(){
  db.query("SELECT title FROM role", function(err, results){
      if(err) throw err;
      inquirer
          .prompt([
              {
                  name: "choice",
                  type: "rawlist",
                  choices: function(){
                      var choiceArr = [];
                      for(i=0; i< results.length; i++){
                          choiceArr.push(results[i].title);
                      }
                      return choiceArr;
                  },
                  message: "Select role"
              }
          ]).then(function(answer){
              console.log(answer.choice);
              db.query(
                  "SELECT e.id AS ID, e.first_name AS First, e.last_name AS Last, e.role_id AS Role, r.salary AS Salary, m.last_name AS Manager, d.name AS Department FROM employee e LEFT JOIN employee m ON e.manager_id = m.id LEFT JOIN role r ON e.role_id = r.title LEFT JOIN department d ON r.department_id = d.id WHERE e.role_id =?", [answer.choice], function(err, results){
                      if(err) throw err;
                      console.table(results);
                      start();
                  }
              )
          });
  });

}


function add(){
  inquirer
      .prompt([
          {
              type: "list",
              name: "add",
              message: "What would you like to add?",
              choices: ["Department", "Employee role", "Employee"]
          }
      ]).then(function(res){
          switch(res.add){
              case "Department":
                  addDepartment();
                  break;
              case "Employee role":
                  addEmployeeRole();
                  break;
              case "Employee":
                  addEmployee();
                  break;
              default:
                  console.log("default");
          }
      })
}

function addDepartment(){
  inquirer
      .prompt([
          {
              name: "department",
              type: "input",
              message: "What would you like the department name to be?"
          }
      ]).then(function(answer){
          db.query(
              "INSERT INTO department VALUES (DEFAULT, ?)", 
              [answer.department], 
              function(err){
                  if(err) throw err;
                  console.log("-----------------------------------------");
                  console.log("Departments updated with "+ answer.department);
                  console.log("-----------------------------------------");
                  start();
              }
          )
      })
}

function addEmployeeRole(){
  inquirer
      .prompt([
          {
              name: "role",
              type: "input",
              message: "Enter role title:"
          },
          {
              name: "salary",
              type: "number",
              message: "Enter salary",
              validate: function(value){
                  if(isNaN(value) === false){
                      return true;
                  }
                  return false;
              }
          },
          {
              name: "department_id",
              type: "number",
              message: "Enter department id",
              validate: function(value){
                  if(isNaN(value) === false){
                      return true;
                  }
                  return false;
              }
          }

      ]).then(function(answer){
          db.query(
              "INSERT INTO role SET ?", 
              {
                  title: answer.role,
                  salary: answer.salary,
                  department_id: answer.department_id
              }, 
              function(err){
                  if(err) throw err;
                  console.log("-----------------------------------------");
                  console.log("Employee Roles updated with "+ answer.role);
                  console.log("-----------------------------------------");
                  start();
              }
          )
      })
}

function addEmployee(){
  db.query("SELECT * FROM role", function(err, results){
      if(err) throw err;
      inquirer
      .prompt([
          {
              name: "firstName",
              type: "input",
              message: "Enter employee first name"
          },
          {
              name: "lastName",
              type: "input",
              message: "Enter employee last name"
          },  
          {
              name: "role",
              type: "rawlist",
              choices: function(){
                  var choiceArr = [];
                  for(i=0; i< results.length; i++){
                      choiceArr.push(results[i].title)
                  }
                  return choiceArr;
              },
              message: "Select title"
          },
          {
              name: "manager",
              type: "number",
              validate: function(value){
                  if(isNaN(value) === false){
                      return true;
                  }
                  return false;
              },
              message: "Enter manager ID",
              default: "1"
          }
      ])
      .then(function(answer){
          db.query(
              "INSERT INTO employee SET ?",
              {
                  first_name: answer.firstName,
                  last_name: answer.lastName,
                  role_id: answer.role,
                  manager_id: answer.manager
              }
          )
          console.log("-----------------------------------------"),
          console.log("Employee Added Successfully"),
          console.log("-----------------------------------------");
          start()  
      });
  });
}

function updateEmployee(){
  db.query("SELECT * FROM employee",
      function(err, results){
      if(err) throw err;
      inquirer 
          .prompt([
              {
                  name: "choice",
                  type: "rawlist",
                  choices: function(){
                      let choiceArr = [];
                      for(i=0; i< results.length; i++)
                      {
                          choiceArr.push(results[i].last_name);
                      }
                      return choiceArr;
                  },
                  message: "Select employee to update"
              }
          ])
          .then(function(answer){
              const saveName = answer.choice;

              db.query("SELECT * FROM employee", 
              function(err, results){
                  if(err) throw err;
              inquirer
              .prompt([
                  {
                      name: "role",
                      type: "rawlist",
                      choices: function(){
                          var choiceArr = [];
                          for(i=0; i< results.length; i++){
                              choiceArr.push(results[i].role_id)
                          }
                          return choiceArr;
                      },
                      message: "Select title"
                  },
                  {
                      name: "manager",
                      type: "number",
                      validate: function(value){
                          if(isNaN(value) === false){
                              return true;
                          }
                          return false;
                      },
                      message: "Enter new manager ID",
                      default: "1"
                  }
              ]).then(function(answer){
                  console.log(answer);
                  console.log(saveName);
                  db.query("UPDATE employee SET ? WHERE last_name = ?",
                      [
                          {
                              role_id: answer.role,
                              manager_id: answer.manager
                          }, saveName  
                      ], 
                  ),
                  console.log("-----------------------------------------");
                  console.log("Employee updated");
                  console.log("-----------------------------------------");
                  start();
              });     
          })      
      })
  })
}