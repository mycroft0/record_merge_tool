###### Note: Some of functions below may later be moved into separate module.

## FMS Common services
Module name: FMS Common Sevice - FMSCS ( gateway base url: /api/v1/fmscs/ )
Provides functionality for common FMS data (like jobs)
Data is returned in format:
```
{
	Ok: true | false,
	message: <Message>.
	data: { <List of projects> }
}
```	

### Startup application
In order to run application follow next steps:
* Install project dependencies running ```npm install``` command
* create .env file from .env.template and set environment variable
* start application ```npm run start```

#### Routes information
* GET API URL for getting project details, searching by Job number:

```/api/v1/fmscs/<database>/projects?jobNo=<FMS Job number>```

* GET API URL for getting project details, searching by id:

```/api/v1/fmscs/<database>/projects?wardProjectId=<FMS ward project id>```

* GET API URL for getting dataset configs details, searching dataset addersses:

```/api/v1/fmscs/<database>/configs/addresses```

* PATCH API URL for setting FMS project/job/load number:

```/api/v1/fmscs/<database>/sequences/next/:type/:id?date=<ISO project/job/load date>```

Where:
* :id => id number of newly created record where sequence should be set 
* :type => type of entity for which sequence is setting. Possible values are:
* tt_load - for Track & Trace loads
* tt_order - for Track & Trace orders
* wp - for FMS jobs ( old job version )
* fms_prj - for FMS current projects

#### Examples (cURL):


Note: in examples below is using base url format for sending request through gateway service that is running on localhost:6999


##### Project details
```
// GET list of project details
// Searching by job number  
curl "http://localhost:6999/api/v1/fmscs/mwcz/projects?jobNo=CZ2100"

// Searching by job id ( ward_project.ward_project_id column )  
curl "http://localhost:6999/api/v1/fmscs/mwcz/projects?wardProjectId=162238"
```

Returned project data contains next information:
- wardProjectId - database id of job/project
- jobNo - FMS job number
- mawb - FMS MAWB (master way bill) number
- hawb - FMS HAWB (house way bill) number
- origin - origin country name 
- originCode - origin country code
- destination - destination country name
- destinationCode - destination country code
- handledBy - name of person who handling job/project
- reference - project's reference 


*NOTES*:
1) Search with jobNo parameter on backend is done with ILIKE '%[data from request]%'
2) Search with jobNumber is searching for pattern in ward_project.job_no | ward_project.mawb | ward_project.reference fields, so either value could be provided in request query.

##### Getting FMS config details
```
// GET dataset address details
curl "http://localhost:6999/api/v1/fmscs/mwcz/configs/addresses"

```

Returned data contains next information:
- company - dataset company name
- phone - phone number
- address1, address2, city, zipcode, country - company's address details


*NOTES*:
1) If dataset has activated 'dept_diff_address' in fms_config table then company details retrieved based on branch details stored through FMS => System => Settings ( data source job_departments table )

##### Setting Project/job/load/order sequence number
```
// PATCH request for setting job number for job with id = 12345 and date = 2022-02-05
curl "http://localhost:6999/api/v1/fmscs/mwcz/sequences/next/wp/12345?date=2022-02-05"

// PATCH request for setting sequence number for Track & Trace Load with id = 12345 and date = 2021-12-15
curl "http://localhost:6999/api/v1/fmscs/mwcz/sequences/next/tt_load/12345?date=2022-02-05"
```