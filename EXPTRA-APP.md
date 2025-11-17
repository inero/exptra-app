### EXPTRA-AI

I want to create new react native (expo go) mobile application with firebase authentication and to store the customer application specific details like their month start date, bedget and nickname, etc.. Application should use the react provider pattern and the should have the modern neat UI and animation wherever it is applicable to display all the screens elemens and all the controls within the application. 

## THE REQUIREMENTS
This application all about automatically reading the users mobile sms message and detect all the banking and transactional sms and calculate the income and expenses automatically monthly. The initial installation time can read all the sms once and cache the details to show the existing transactional information and from then it can read or upadte any new sms whenever user open's the app again to show the uptodate expense and income details.
The application should understand the customer account information and the category of the income or expense based on the sms message and detect the bank name using regular expression and can show the account wise income and expense information. The user should be allowed to add or edit the account details and the category manually and also allowed to add custom income and expense with predefined generic categories along with custom category feature. And the application should also show the category wise monthly expense in detail. The application should also have feature to capture the budget and the user nickname and all other basic setting details to have the application customised for their need. This application should also have the feature to capture the regular bills and EMI information like billing account number, category and the amount and the bill date and the date in which user wants to get reminder from the app.

## The eloborated screen level details listed as below,

1. LOGIN / SIGNUP PAGE: 
   login or signup page with the application with the title "Exptra-AI". The login and signup functionality to be implemented using firebase authentication
   
   # Here is the firebase configuration to use for authentication
	
   firebaseConfig = {
  		apiKey: "AIzaSyD6CQ7RC6CPWnf75TTxkSwFH6QAOyaNNe4",
  		authDomain: "fir-auth-aaa2e.firebaseapp.com",
  		projectId: "fir-auth-aaa2e",
  		storageBucket: "fir-auth-aaa2e.appspot.com",
  		messagingSenderId: "904217172879",
  		appId: "1:904217172879:web:b39b700ac2266d642d89fa",
	}

   After the login authentication user can be directly taken to the initial setup screen where we can capture the customer nickname and the monthly budget amount and the customer monthly salary credit date or the month start date for the next month expence cycle calculation. This initial setup page can still be accessible from the setting menu later and can be skipped by user with the notification mentioning to make this change later through the menu.

   After the successful login user can see the dashboard as default screen and once after the successfull sign up and login user don't need to login again everytime when they open the app and the authentication which can be cached and can directly loaded with dashboard from the second time onwards or untile the user logout.

2. DASHBOARD PAGE:
   The default Dashboard screen should show the current month total expense calculated based budget set by the user during the initial setup and can be displayed with modern UI with speedometer type animated view of their remaning expense based on the budget. And also should be showing the details transaction information seperately for expense and income with account and category and the amount. The category can be an unique icon so it will be displayed elegantly in scree with the transaction list. On moth change change in the dashboard should update the dashboard to show records according to the selected month.

   The dashboard also contains three split sections to show the bank balance (hidden amount by default), pending bill total amount and the total spend of the month and this section should show show right after the animated speedometer for remaining amount to spend based on the user budget.

   This application should be created with fully functional, deployable and runnable in the actual android device with the user concent access permission for the sms read and to store cache in mobile storage and to store the sms calculated information in firebase storage. And should produce the .apk file directly as output. All the neccessary requirement documents also to be produced along with readme file and the proper package.json scripts to create and extract the apk file.