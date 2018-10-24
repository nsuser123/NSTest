/**
 * Copyright (c) 1998-2011 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */

/**
 * The purpose of this script is <changme>
 *
 * @param (string) <varname><desc>
 * @return <desc>
 * @type int
 * @author Regina R. dela Cruz
 * @version 1.0
 */
function saveRecord_SalesOrderApprovalValidation() { // client sav.e
	var logger = new Logger();
	var stLoggerTitle = 'saveRecord_SalesOrderApprovalValidation';
	var approvalAlert1 = '';
	var approvalAlert2 = '';
	var approvalAlert3 = '';
	var approvalAlert4 = '';
	logger.enableDebug();

	try {
		var objContext = nlapiGetContext();
		var stUser = objContext.getUser();
		var stUserRole = objContext.getRole();
		var stUserSubsidiary = objContext.getSubsidiary();

		var paramSubsidiary = objContext.getSetting('SCRIPT', 'custscript_approval_subsidiary');
		//       var paramSOApprovalRole = objContext.getSetting('SCRIPT', 'custscript_so_approval_role');
		//       var paramManagerRole = objContext.getSetting('SCRIPT', 'custscript_manager_role');
		var paramCSRRole = objContext.getSetting('SCRIPT', 'custscript_csr_role');
		var paramCSARole = objContext.getSetting('SCRIPT', 'custscript_csa_role');
		var paramAdminRole = objContext.getSetting('SCRIPT', 'custscript_admin_role');

		var arrCSRRole = (paramCSRRole == '' || paramCSRRole == null || paramCSRRole == undefined) ? new Array() : paramCSRRole.split(",");
		var arrCSARole = (paramCSARole == '' || paramCSARole == null || paramCSARole == undefined) ? new Array() : paramCSARole.split(",");
		var arrAdminRole = (paramAdminRole == '' || paramAdminRole == null || paramAdminRole == undefined) ? new Array() : paramAdminRole.split(",");

		var TERMS_PAYMENT_ADV = '69';
		var PENDING_FULFILL = 'B';
		var PENDING_APPROVAL = 'A';

		var constBBASubsidiary = 8; //hong kong
		
		var korea_subsidiary = 10;//KOREA 
		//var arrApprRoles = [3, 1056, 1057, 1059, 1060];
		var arrApprRoles = [3,1058, 1060,1080,1078];//Admin, CHK Admin, CHK Accounting Manager, CKR Admin, CKR ACCOUNTING MANAGER
		var constMinOrderVal = 5000;

		logger.debug(stLoggerTitle, '-------------- Start --------------'+stUserSubsidiary+'----recId='+nlapiGetRecordId());
		//Adding this check for blocking jackson id 12/30/2016
		//if(stUser != '95619')
		{
		var SOApprovalCheck = nlapiGetFieldValue('custbody_chk_so_approval_check');
		// Added to support BBA
		if ((stUserSubsidiary == constBBASubsidiary||stUserSubsidiary == korea_subsidiary) && SOApprovalCheck == 'T') {
			var stSalesOrderId = nlapiGetRecordId();
			var stNewStatus = nlapiGetFieldValue('orderstatus');
			var flance = forceParseFloat(nlapiGetFieldValue('balance'));
			var flOrdTotal = forceParseFloat(nlapiGetFieldValue('total'));
            var exchrate = forceParseFloat(nlapiGetFieldValue('exchangerate'));
        	var so_currency = nlapiGetFieldValue('currency');
        	nlapiLogExecution('ERROR', 'so_currency', so_currency);
        
			if( exchrate == 0)
				exchrate = 1;
				
							
			var stOldStatus = '';
			if (!isEmpty(stSalesOrderId)) {
				stOldStatus = nlapiLookupField('salesorder', stSalesOrderId, 'status');
			}
			logger.debug(stLoggerTitle, 'stOldStatus = ' + stOldStatus);
			logger.debug(stLoggerTitle, 'stNewStatus = ' + stNewStatus);
			logger.debug(stLoggerTitle, 'stUserRole = ' + stUserRole); 

			if (stOldStatus == " " || stOldStatus == "" || stOldStatus == "undefined" || stOldStatus == null || stOldStatus == "pendingApproval" || stOldStatus == "Pending Approval" || stOldStatus == "A") {

				
				var stCustomer = nlapiGetFieldValue('entity');
				var stCustomerName = nlapiGetFieldText('entity'); // Newly added on Sep 04 2018
				approvalAlert1 = 'Customer: '+stCustomerName+'\n';
				var stTerms = nlapiGetFieldValue('terms');
				var boolPaymentRecd = nlapiGetFieldValue('custbody_bb_payment_recieved');
				 
				var cols = nlapiLookupField('customer', stCustomer, ['creditlimit', 'fxbalance', 'overduebalance', 'custentity9', 'fxunbilledorders','currency','creditholdoverride','daysoverdue']); //Newly added credithold on Sep 04 2018
                
				var daysOverDue = cols.daysoverdue;//Newly added on Sep 04 2018
				nlapiLogExecution('ERROR', 'daysOverDue', daysOverDue);
				
				
				var primary_currency = cols.currency;
				
				nlapiLogExecution('ERROR', 'primary_currency', primary_currency);
				/*if(so_currency!=primary_currency)
				{
				   
				       if(primary_currency==3&&so_currency==8) // primary in usd and so in hkd- need to convert hkd to usd
				    	   {
				    	   flOrdTotal =    parseFloat(flOrdTotal*7.75169);
				    	   }
				       
				       if(primary_currency==8&&so_currency==3)// primary in hkd and so in usd- need to convert usd to hkd
				    	   {
				    	   flOrdTotal =    parseFloat(flOrdTotal*7.7616);
				    	   }
				}*/

				var exchange_rate1 = 1;
				
				if(so_currency!=primary_currency)
				{
					  
					exchange_rate1 = forceParseFloat(nlapiExchangeRate(so_currency, primary_currency));
				}
				
				nlapiLogExecution('ERROR', 'exchange rate', exchange_rate1);
				
				flOrdTotal = forceParseFloat(flOrdTotal*exchange_rate1);
				
				nlapiLogExecution('ERROR', 'client_SO_AMOUNT_In customer primary_CURRENCY', flOrdTotal);
				
				
				var flUnbilledOrd = forceParseFloat(cols.fxunbilledorders);
				
				nlapiLogExecution('ERROR', 'client_flUnbilledOrd', flUnbilledOrd);
				var flCreditLimit = forceParseFloat(cols.creditlimit);
				
				nlapiLogExecution('ERROR', 'client_flCreditLimit', flCreditLimit);
	    	    var flBalance = forceParseFloat(cols.fxbalance);
	    	    
	    	    nlapiLogExecution('ERROR', 'client_flBalance', flBalance);
				var flOverdueBalance = forceParseFloat(cols.overduebalance);
				var flTotalOpen = flUnbilledOrd + flBalance + flOrdTotal;
				nlapiLogExecution('ERROR', 'client_TotalOpen', flTotalOpen);
				
				var creditHold = cols.creditholdoverride;//Newly added on Sep 04 2018
				nlapiLogExecution('ERROR', 'creditHold', creditHold);
				
				logger.debug(stLoggerTitle, 'stCustomer = ' + stCustomer);
				logger.debug(stLoggerTitle, 'stTerms = ' + stTerms);
				logger.debug(stLoggerTitle, 'flCreditLimit = ' + flCreditLimit);
				logger.debug(stLoggerTitle, 'flBalance = ' + flBalance);
				logger.debug(stLoggerTitle, 'flance = ' + flance);
				logger.debug(stLoggerTitle, 'flOrdTotal = ' + flOrdTotal);
				logger.debug(stLoggerTitle, 'flOverdueBalance = ' + flOverdueBalance);
				logger.debug(stLoggerTitle, 'flUnbilledOrd = ' + flUnbilledOrd);
				logger.debug(stLoggerTitle, 'Intercompany = ' + cols.custentity9);
				logger.debug(stLoggerTitle, 'CreditHold = ' + cols.creditholdoverride);
				
				var curncy = nlapiLookupField('customer', stCustomer, ['currency'],true);
				
				var cal1 = parseFloat(flCreditLimit)-parseFloat(flTotalOpen);
				approvalAlert2 = 'Currency: '+curncy.currency+' \n \n'+'Usable Credit Limit: '+parseFloat(cal1).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n'+'Credit Limit: '+flCreditLimit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n'+'Current Balance: '+flBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n'+'Unbilled Orders: '+flUnbilledOrd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n';
				
				var stAppDenialReason = '';
				
				logger.debug(stLoggerTitle, '');
				if(creditHold != 'T'){          //New added check to skip approval if credit hold is set to off on customer record Sep 04 2018
				if (cols.custentity9 == 'F') {
					if (flOrdTotal < constMinOrderVal) {
						var minorder_alertnote = 'Please note this Order should exeed $5,000 in value';
						if(so_currency == 15&&flOrdTotal <5000000)//korean currency
							{
						 minorder_alertnote = 'Please note this Order should exeed 5 million korea won in value';
						 alert(minorder_alertnote);
							}
						if(so_currency != 15)
						{
					 minorder_alertnote = 'Please note this Order should exeed $5,000 in value';
					 alert(minorder_alertnote);
						}
						// stAppDenialReason = 'Order must exeed $5,000 in value';
					}

					if (flTotalOpen > flCreditLimit) {
						stAppDenialReason = 'Over Credit Limit, ';
					}
                  
					
					
					// old code for overdue
					/*if (flOverdueBalance > 0) {
						stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
					}*/
					
					var credit_total =0;
					
					var overdue_invoice_total = 0;
					
					var filters_transaction = new Array();
					
					filters_transaction.push(new nlobjSearchFilter('entity', null, 'anyof', stCustomer));
					
					filters_transaction.push(new nlobjSearchFilter('status', null, 'anyof', 'CustCred:A','CustInvc:A'));
					
					filters_transaction.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
					
					
					var column_transaction = new Array();
					
					column_transaction.push(new nlobjSearchColumn('fxamount'));
					
				//column_transaction.push(new nlobjSearchColumn('datecreated').setSort(true));
                  
                   column_transaction.push(new nlobjSearchColumn('trandate'));
					
					column_transaction.push(new nlobjSearchColumn('type'));
					
					column_transaction.push(new nlobjSearchColumn('daysoverdue').setSort(true));
					
					column_transaction.push(new nlobjSearchColumn('currency'));
					
					column_transaction.push(new nlobjSearchColumn('tranid'));
					
					var transaction_search = nlapiSearchRecord('transaction', null, filters_transaction, column_transaction);
					
					var overdueinv_tranid = new Array();
					    
					 var overdueinv_amount = new Array();
					 
					 var overdueinv_days = new Array();
					
					if (transaction_search!=null)
						{
						     
						              for(var i=0;i<transaction_search.length;i++)
						            	  {
						            	  
						            	            var tran_type = transaction_search[i].getText('type');
						            	            
						            	            //nlapiLogExecution('ERROR', 'tran_type', tran_type);
						            	            
						            	            if(tran_type=='Credit Memo')
						            	            	{
						            	            	
						            	            	var cm_currency = transaction_search[i].getValue('currency');
						            	            	
						            	            	if(cm_currency!=primary_currency)
						            					{
						            						  
						            						exchange_rate1 = forceParseFloat(nlapiExchangeRate(cm_currency, primary_currency));
						            					}
						            	            	
						            	            	else
						            	            		{
						            	            		exchange_rate1 = 1;
						            	            		}
						            	            	
						            	            	credit_total = credit_total + parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1;
						            	            	
						            	            	
						            	            	       
						            	            	}
						            	            
						            	            var invoice_overdue = transaction_search[i].getValue('daysoverdue');
						            	            
						            	            if(tran_type=='Invoice'&&invoice_overdue>=1)
						            	            	{
						            	            	
                                                          var inv_currency = transaction_search[i].getValue('currency');
						            	            	
						            	            	if(inv_currency!=primary_currency)
						            					{
						            						  
						            						exchange_rate1 = forceParseFloat(nlapiExchangeRate(inv_currency, primary_currency));
						            					}
						            	            	
						            	            	else
						            	            		{
						            	            		exchange_rate1 = 1;
						            	            		}
						            	            	
						            	            	overdue_invoice_total = overdue_invoice_total + parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1;
						            	            	     
						            	            	
						            	            	overdueinv_amount.push(parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1);
						            	            	   
						            	                overdueinv_tranid.push(transaction_search[i].getValue('tranid'));
						            	                
						            	                overdueinv_days.push(transaction_search[i].getValue('daysoverdue'));
						            	            	}
						            	            
						            	            
						            	  }//loop
						              
						              
						              nlapiLogExecution('ERROR', 'credit_total', credit_total);
						              
						              nlapiLogExecution('ERROR', 'overdue_invoice_total ', overdue_invoice_total);
						              var cal2 = parseFloat(overdue_invoice_total)-parseFloat(credit_total);
						              approvalAlert3 = 'Overdue Balance: '+parseFloat(cal2).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n';
						              approvalAlert4 = 'Days Overdue: '+daysOverDue;
						              
						              if((overdue_invoice_total+credit_total)>0)// overdue total amount more than credit total amount
						        	  {
						        	  stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
						        	  
						        	  var check_inv_amount = 0;
						        	  
						        	  for(var i=0;i<overdueinv_amount.length;i++)
						        		  {
						        		  check_inv_amount = check_inv_amount+ parseFloat(overdueinv_amount[i]);
						        		  
						        		  if(check_inv_amount+credit_total>0)
						        			  {
						        			         var inv_tranid =   overdueinv_tranid[i];
						        			         
						        			         nlapiSetFieldValue('custbody_soapproval_overdueinvoice_id', inv_tranid);
						        			         
						        			         var inv_age = overdueinv_days[i];
						        			         
						        			         nlapiSetFieldValue('custbody_soapproval_overdueinvoice_day', inv_age);
						        			         break;
						        			  }
						        		          
						        		  }//loop
						        	  }//overdue condition
						              
						}//end of overdue
					
					}
				nlapiSetFieldValue('custbody_bb_app_denial_reason', stAppDenialReason);

				if (!isEmpty(stAppDenialReason)) {
					if (inArray(stUserRole, arrApprRoles)) {
						if (!confirm(approvalAlert1+'\n'+approvalAlert2+'\n'+approvalAlert3+'\n'+approvalAlert4+'\n \n'+'Please review Approval Denial Reason on the order. Are you sure you want to approve the order ?')) {
							nlapiSetFieldValue('custbody_bb_app_denial_reason', stAppDenialReason);
							//nlapiSetFieldValue('orderstatus', PENDING_APPROVAL);
						}
						else// user clicks OK
						{
							nlapiSetFieldValue('custbody_bb_app_denial_reason', null);
							nlapiSetFieldValue('orderstatus', PENDING_FULFILL);
						}
					} else// if(inArray(stUserRole,arrCSRRole))
					{
						alert('The sales order cannot be approved. Please see Approval Denial Reason on the order.');
						nlapiSetFieldValue('orderstatus', PENDING_APPROVAL);
					}
				} else
					nlapiSetFieldValue('orderstatus', PENDING_FULFILL);
				// }
			}
				else{
					nlapiSetFieldValue('orderstatus', PENDING_FULFILL);
				}
				
			}
			nlapiSetFieldValue('tobeemailed', 'F');
		}
		

		// Non-BBA Process
		if (stUserSubsidiary == paramSubsidiary) {
			var stSalesOrderId = nlapiGetRecordId();
			var stNewStatus = nlapiGetFieldValue('orderstatus');
			var flance = forceParseFloat(nlapiGetFieldValue('balance'));
			// Asif 1109 - Added to get customer balance in order currency.
			var stOldStatus = '';
			if (!isEmpty(stSalesOrderId)) {
				stOldStatus = nlapiLookupField('salesorder', stSalesOrderId, 'status');
			}
			logger.debug(stLoggerTitle, 'stOldStatus = ' + stOldStatus);
			logger.debug(stLoggerTitle, 'stNewStatus = ' + stNewStatus);

			if (stOldStatus != 'pendingFulfillment' && stNewStatus == PENDING_FULFILL) {
				if (!inArray(stUserRole, arrCSRRole) && !inArray(stUserRole, arrCSARole) && !inArray(stUserRole, arrAdminRole))
				//if(stUserRole != paramCSRRole && stUserRole != paramCSARole && stUserRole != paramAdminRole)
				{
					alert('Your role is not authorized to approve Sales Order');
					return false;
				} else {
					var stCustomer = nlapiGetFieldValue('entity');
					var stTerms = nlapiGetFieldValue('terms');
					var boolPaymentRecd = nlapiGetFieldValue('custbody_bb_payment_recieved');
					// Asif 0712 - Added

					var cols = nlapiLookupField('customer', stCustomer, ['creditlimit', 'balance', 'overduebalance']);

					var flCreditLimit = forceParseFloat(cols.creditlimit);
					var flBalance = forceParseFloat(cols.balance);
					var flOverdueBalance = forceParseFloat(cols.overduebalance);

					logger.debug(stLoggerTitle, 'stCustomer = ' + stCustomer);
					logger.debug(stLoggerTitle, 'stTerms = ' + stTerms);
					logger.debug(stLoggerTitle, 'flCreditLimit = ' + flCreditLimit);
					logger.debug(stLoggerTitle, 'flBalance = ' + flBalance);
					logger.debug(stLoggerTitle, 'flance = ' + flance);
					logger.debug(stLoggerTitle, 'flOverdueBalance = ' + flOverdueBalance);

					var stAppDenialReason = '';

					// if(flBalance > flCreditLimit)
					if (flance > flCreditLimit)// Asif 1109 - Added to compare against order currency balance
					{
						stAppDenialReason = 'Over Credit Limit, ';
					}

					if (flOverdueBalance > 0) {
						stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
					}

					/*        if(stTerms == TERMS_PAYMENT_ADV && !isEmpty(stSalesOrderId)) // Asif 0712 - Not needed as payment recieved flag is checked manually by users on SO
					 {
					 var filters = new Array();
					 filters.push(new nlobjSearchFilter('custbody_clxsolink',null,'is',stSalesOrderId));
					 filters.push(new nlobjSearchFilter('mainline',null,'is','T'));

					 var columns = new Array();
					 columns.push(new nlobjSearchColumn('internalid',null,'GROUP'));
					 columns.push(new nlobjSearchColumn('total',null,'SUM'));

					 var results = nlapiSearchRecord('customerpayment',null,filters,columns);
					 if(results)
					 {
					 var flPaymentTotal = forceParseFloat(results[0].getValue('total',null,'SUM'));
					 var flTotal = forceParseFloat(nlapiLookupField('salesorder',stSalesOrderId,'total'));
					 logger.debug(stLoggerTitle, 'flPaymentTotal = ' + flPaymentTotal);
					 logger.debug(stLoggerTitle, 'flTotal = ' + flTotal);

					 if(flTotal > flPaymentTotal)
					 {
					 stAppDenialReason = 'Deposit less than order total';
					 }
					 }
					 else
					 {
					 stAppDenialReason = 'No Payments';
					 }
					 }*/

					if (stTerms == TERMS_PAYMENT_ADV && boolPaymentRecd == 'F')// Asif 0712 - Added in place of above payment validation.
					{
						stAppDenialReason = stAppDenialReason + 'No Payments, ';
					}

					//                if(isEmpty(stSalesOrderId))
					//                {
					//                    stAppDenialReason = 'Cannot approve on create of sales order';
					//                }

					nlapiSetFieldValue('custbody_bb_app_denial_reason', stAppDenialReason);

					if (!isEmpty(stAppDenialReason)) {
						//              nlapiSetFieldValue('custbody_bb_app_denial_reason',stAppDenialReason); -- Asif 0712 - Not needed here. Set before If.
						if (stUser=='96224'|| inArray(stUserRole, arrCSARole) || inArray(stUserRole, arrAdminRole))
						//if(stUserRole == paramCSARole || stUserRole == paramAdminRole)
						{
							if (!confirm('Please review Approval Denial Reason on the order. Are you sure you want to approve the order ?')) {
								nlapiSetFieldValue('orderstatus', PENDING_APPROVAL);
							} else// user clicks OK
							{
								nlapiSetFieldValue('custbody_bb_app_denial_reason', null);
							}
						} else if (inArray(stUserRole, arrCSRRole))
						//else if(stUserRole == paramCSRRole)
						{
							alert('The sales order cannot be approved. Please see Approval Denial Reason on the order.');
							nlapiSetFieldValue('orderstatus', PENDING_APPROVAL);
						}
					}
				}
			}
		}	
		}


		logger.debug(stLoggerTitle, '-------------- End --------------');
		return true;
	} catch (error) {
		if (error.getDetails != undefined) {
			logger.error('Process Error', error.getCode() + ': ' + error.getDetails());
			return true;
			//throw error;
		} else {
			logger.error('Unexpected Error', error.toString());
			return true;
			//throw nlapiCreateError('99999', error.toString());
		}
	}
}






/**
 *The purpose of this script is <changme>
 *
 * @param (string) <varname><desc>
 * @return <desc>
 * @type int
 * @author Regina R. dela Cruz
 * @version 1.0
 */
function setOrderStatusOnApprove() { // when user clicks on custom approve button created via ue befor load
	try {
		var objContext = nlapiGetContext();
		var stUser = objContext.getUser();
		var stUserRole = objContext.getRole();
		var stUserSubsidiary = objContext.getSubsidiary();
		var paramSubsidiary = objContext.getSetting('SCRIPT', 'custscript_approval_subsidiary');
		//       var paramSOApprovalRole = objContext.getSetting('SCRIPT', 'custscript_so_approval_role');
		//       var paramManagerRole = objContext.getSetting('SCRIPT', 'custscript_manager_role');
		var paramCSRRole = objContext.getSetting('SCRIPT', 'custscript_csr_role');
		var paramCSARole = objContext.getSetting('SCRIPT', 'custscript_csa_role');
		var paramAdminRole = objContext.getSetting('SCRIPT', 'custscript_admin_role');

		var arrCSRRole = (paramCSRRole == '' || paramCSRRole == null || paramCSRRole == undefined) ? new Array() : paramCSRRole.split(",");
		var arrCSARole = (paramCSARole == '' || paramCSARole == null || paramCSARole == undefined) ? new Array() : paramCSARole.split(",");
		var arrAdminRole = (paramAdminRole == '' || paramAdminRole == null || paramAdminRole == undefined) ? new Array() : paramAdminRole.split(",");

		var TERMS_PAYMENT_ADV = '69';
		var PENDING_FULFILL = 'B';
		var PENDING_APPROVAL = 'A';

		var constBBASubsidiary = 8;//Hong Kong
		var korea_subsidiary= 10;//S.Korea
		//var arrApprRoles = [3, 1060,1074];// others 3, 1056, 1057, 1059, 1060
		var arrApprRoles = [3,1058, 1060,1080,1078];//Admin, CHK Admin, CHK Accounting Manager, CKR Admin,CKR ACCOUNTING MANAGER
	    
		var constMinOrderVal = 5000;
		var approvalAlert1 = '';
		var approvalAlert2 = '';
		var approvalAlert3 = '';
		var approvalAlert4 = '';// Sep 04 2018
		
		nlapiLogExecution('debug', '-------------- Start --------------', '----recId='+nlapiGetRecordId());
		// Added to support BBA
		if (stUserSubsidiary == constBBASubsidiary||stUserSubsidiary == korea_subsidiary) {

			var stSalesOrderId = nlapiGetRecordId();
			if (!inArray(stUserRole, arrApprRoles)) {
				alert('Your role is not authorized to approve Sales Order');
				return false;
			} else {
				var recSalesOrder = nlapiLoadRecord('salesorder', stSalesOrderId);
				var stCustomer = recSalesOrder.getFieldValue('entity');
				var stTerms = recSalesOrder.getFieldValue('terms');
				var boolPaymentRecd = recSalesOrder.getFieldValue('custbody_bb_payment_recieved');
				var flance = parseFloat(recSalesOrder.getFieldValue('balance'));
				var flOrdTotal = forceParseFloat(nlapiGetFieldValue('total'));
				
				var cols = nlapiLookupField('customer', stCustomer, ['creditlimit', 'fxbalance', 'overduebalance', 'custentity9', 'fxunbilledorders', 'terms','currency','creditholdoverride','daysoverdue','companyname']);//Newly added credithold on Sep 04 2018
				
				approvalAlert1 = 'Customer: '+cols.companyname+'\n';
				//alert(approvalAlert1);
				
				
				var daysOverDue = cols.daysoverdue;//Newly added on Sep 04 2018
				
				
				
				
				var creditHold = cols.creditholdoverride;//Newly added on Sep 04 2018
				nlapiLogExecution('ERROR', 'creditHold', creditHold);
				
				var flUnbilledOrd = parseFloat(cols.fxunbilledorders);
				// nlapiLogExecution('ERROR', 'ue_flUnbilledOrd', flBalance);
				
				//alert('ue_flUnbilledOrd= '+flUnbilledOrd );
				var flCreditLimit = parseFloat(cols.creditlimit);
				//alert('flCreditLimit= '+flCreditLimit);
				// nlapiLogExecution('ERROR', 'ue_flCreditLimit', flBalance);
				var flBalance = parseFloat(cols.fxbalance);
				//alert('flBalance= '+flBalance);
				
				var primary_currency = (cols.currency);
				
			//	alert('primary_currency= '+primary_currency);
				 //nlapiLogExecution('ERROR', 'ue_flBalance', flBalance);
				var flOverdueBalance = parseFloat(cols.overduebalance);
				var flTotalOpen = flUnbilledOrd + flBalance; // no need of SO amount, as it would be already in unbilled order amount
				var customer_terms = (cols.terms);
				
				//alert('flCreditLimit=='+flCreditLimit);
				//alert('flTotalOpen=='+flTotalOpen);
				var cal1=parseFloat(flCreditLimit)-parseFloat(flTotalOpen);
				
				var curncy = nlapiLookupField('customer', stCustomer, ['currency'],true);
				
				approvalAlert2 = 'Currency: '+curncy.currency+' \n \n'+'Usable Credit Limit: '+parseFloat(cal1).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n'+'Credit Limit: '+flCreditLimit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n'+'Current Balance: '+flBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n'+'Unbilled Orders: '+flUnbilledOrd.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n';
				//alert(approvalAlert2);
				
				var stAppDenialReason = '';
				if(creditHold != 'T'){// Newly added credit hold check to skip approval if credit hold is set to off on customer record. Sep 04 2018 
				if (cols.custentity9 == 'F') {
					// if (flOrdTotal < constMinOrderVal) {
					//	stAppDenialReason = 'Order must exeed $5,000 in value';
					// }

					if (flTotalOpen > flCreditLimit) {
						stAppDenialReason = 'Over Credit Limit, ';
					}

					
					
					//overdue code
                   var credit_total =0;
					
					var overdue_invoice_total = 0;
					
					var filters_transaction = new Array();
					
					filters_transaction.push(new nlobjSearchFilter('entity', null, 'anyof', stCustomer));
					
					filters_transaction.push(new nlobjSearchFilter('status', null, 'anyof', 'CustCred:A','CustInvc:A'));
					
					filters_transaction.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
					
					
					var column_transaction = new Array();
					
					column_transaction.push(new nlobjSearchColumn('fxamount'));
					
					column_transaction.push(new nlobjSearchColumn('trandate'));
					
					column_transaction.push(new nlobjSearchColumn('type'));
					
					column_transaction.push(new nlobjSearchColumn('daysoverdue').setSort(true));
					
					column_transaction.push(new nlobjSearchColumn('currency'));
					
					var transaction_search = nlapiSearchRecord('transaction', null, filters_transaction, column_transaction);
					var exchange_rate1 =1;
					if (transaction_search!=null)
						{
						     
						
						              for(var i=0;i<transaction_search.length;i++)
						            	  {
						            	  
						            	 
						            	  
						            	            var tran_type = transaction_search[i].getText('type');
						            	           
						            	            //nlapiLogExecution('ERROR', 'tran_type', tran_type);
						            	            
						            	            if(tran_type=='Credit Memo')
						            	            	{
						            	            	
						            	            	var cm_currency = transaction_search[i].getValue('currency');
						            	            	
						            	            	
						            	            	if(cm_currency!=primary_currency)
						            					{
						            	            	
						            						exchange_rate1 = forceParseFloat(nlapiExchangeRate(cm_currency, primary_currency));
						            						//alert('ex'+exchange_rate1);
						            					}
						            	            	
						            	            	else
						            	            		{
						            	            		exchange_rate1 = 1;
						            	            		}
						            	            	//alert(parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1);
						            	            
						            	            	credit_total = credit_total + parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1;
						            	            	       
						            	            	}
						            	            
						            	            var invoice_overdue = transaction_search[i].getValue('daysoverdue');
						            	            
						            	            if(tran_type=='Invoice'&&invoice_overdue>=1)
						            	            	{
						            	            	
                                                          var inv_currency = transaction_search[i].getValue('currency');
                                                      
						            	            	if(inv_currency!=primary_currency)
						            					{
						            	            		
						            						exchange_rate1 = forceParseFloat(nlapiExchangeRate(inv_currency, primary_currency));
						            						//alert('ex'+exchange_rate1);
						            					}
						            	            	
						            	            	else
						            	            		{
						            	            		exchange_rate1 = 1;
						            	            		}
						            	            	
						            	            	overdue_invoice_total = overdue_invoice_total + parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1;
						            	            	     
						            	            	}
						            	  }
						              
						              
						              //nlapiLogExecution('ERROR', 'credit_total', credit_total);
						              
						              //nlapiLogExecution('ERROR', 'overdue_invoice_total ', overdue_invoice_total);
						              
						            //  alert('credit_total= '+credit_total);
						            //  alert('overdue_invoice_total= '+overdue_invoice_total);
						            //  alert(overdue_invoice_total);
						            //  alert(credit_total);
						              var cal2=parseFloat(overdue_invoice_total)+parseFloat(credit_total);
						              approvalAlert3 = 'Overdue Balance: '+parseFloat(cal2).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'\n';
						              approvalAlert4 =  'Days Overdue: '+daysOverDue+'\n';
						           //   alert(approvalAlert3);
						           //   alert(approvalAlert4);
						              if((overdue_invoice_total+credit_total)>0)// overdue total amount more than credit total amount
						            	  {
						            	  stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
						            	  }
						              
						}//end of overdue
					
					//---- original code for overdue
					/*if (flOverdueBalance > 0) {
						stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
					}*/
					
					
				
				
				}
				nlapiLogExecution('ERROR', 'stAppDenialReason==', stAppDenialReason);
				nlapiSubmitField('salesorder', stSalesOrderId, 'custbody_bb_app_denial_reason', stAppDenialReason);
				var ordStatus = '';
				if (stAppDenialReason != '') {
					if (inArray(stUserRole, arrApprRoles)) {
						if (!confirm(approvalAlert1+'\n'+approvalAlert2+'\n'+approvalAlert3+'\n'+approvalAlert4+'\n \n'+'Please review Approval Denial Reason on the order. Are you sure you want to approve the order ?')) {
							window.location.reload();
							nlapiLogExecution('ERROR', 'in if==', 'in if');
							return true;
						} else {
							stAppDenialReason = '';
							ordStatus = PENDING_FULFILL;
							nlapiLogExecution('ERROR', 'in else==', 'in else');
						}
					} else {
						alert('The sales order cannot be approved. Please see Approval Denial Reason on the order.');
						window.location.reload();
						return true;
					}
				}
			}
				else{
					stAppDenialReason = '';
					ordStatus = PENDING_FULFILL;
					
				}
				

				// recSalesOrder.setFieldValue('custbody_bb_app_denial_reason', stAppDenialReason);
				// recSalesOrder.setFieldValue('orderstatus', ordStatus);
				// nlapiSubmitRecord(recSalesOrder);
			}
		}

		// Non-BBA Process
		if (stUserSubsidiary == paramSubsidiary) {
			var stSalesOrderId = nlapiGetRecordId();
			if (!inArray(stUserRole, arrCSRRole) && !inArray(stUserRole, arrCSARole) && !inArray(stUserRole, arrAdminRole))
			//if(stUserRole != paramCSRRole && stUserRole != paramCSARole && stUserRole != paramAdminRole)
			{
				alert('Your role is not authorized to approve Sales Order');
				return false;
			} else {
				var recSalesOrder = nlapiLoadRecord('salesorder', stSalesOrderId);
				var stCustomer = recSalesOrder.getFieldValue('entity');
				var stTerms = recSalesOrder.getFieldValue('terms');
				var boolPaymentRecd = recSalesOrder.getFieldValue('custbody_bb_payment_recieved');
				// Asif 0712 - Added
				var flance = recSalesOrder.getFieldValue('balance');
				// Asif 1109 - Added to get customer balance in order currency.

				var cols = nlapiLookupField('customer', stCustomer, ['creditlimit', 'balance', 'overduebalance']);

				var flCreditLimit = parseFloat(cols.creditlimit);
				var flBalance = parseFloat(cols.balance);
				var flOverdueBalance = parseFloat(cols.overduebalance);

				var stAppDenialReason = '';

				//if(flBalance > flCreditLimit)
				if (flance > flCreditLimit)// Asif 1109 - Added to compare against order currency balance
				{
					stAppDenialReason = 'Over Credit Limit, ';
				}

				if (flOverdueBalance > 0) {
					stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
				}

				/*        if(stTerms == TERMS_PAYMENT_ADV) // Asif 0712 - Not needed as payment recieved flag is checked manually by users on SO
				 {
				 var filters = new Array();
				 filters.push(new nlobjSearchFilter('custbody_clxsolink',null,'is',stSalesOrderId));
				 filters.push(new nlobjSearchFilter('mainline',null,'is','T'));

				 var columns = new Array();
				 columns.push(new nlobjSearchColumn('internalid',null,'GROUP'));
				 columns.push(new nlobjSearchColumn('total',null,'SUM'));

				 var results = nlapiSearchRecord('customerpayment',null,filters,columns);
				 if(results)
				 {
				 var flPaymentTotal = parseFloat(results[0].getValue('total',null,'SUM'));
				 var flTotal = parseFloat(nlapiLookupField('salesorder',stSalesOrderId,'total'));

				 if(flTotal > flPaymentTotal)
				 {
				 stAppDenialReason = 'Deposit less than order total';
				 }
				 }
				 else
				 {
				 stAppDenialReason = 'No Payments';
				 }
				 }   */

				if (stTerms == TERMS_PAYMENT_ADV && boolPaymentRecd == 'F')// Asif 0712 - Added in place of above payment validation.
				{
					stAppDenialReason = stAppDenialReason + 'No Payments, ';
				}

				nlapiSubmitField('salesorder', stSalesOrderId, 'custbody_bb_app_denial_reason', stAppDenialReason);

				if (stAppDenialReason != '') {
					//     nlapiSubmitField('salesorder',stSalesOrderId,'custbody_bb_app_denial_reason',stAppDenialReason); -- Asif 0712 - Not needed here. Set before if.

					if (stUser=='96224' || inArray(stUserRole, arrCSARole) || inArray(stUserRole, arrAdminRole))
					//if(stUserRole == paramCSARole || stUserRole == paramAdminRole)
					{
						if (!confirm('Please review Approval Denial Reason on the order. Are you sure you want to approve the order ?')) {
							window.location.reload();
							return true;
						} else// user clicks OK
						{
							nlapiSubmitField('salesorder', stSalesOrderId, 'custbody_bb_app_denial_reason', null);
						}
					} else if (inArray(stUserRole, arrCSRRole))
					//else if(stUserRole == paramCSRRole)
					{
						alert('The sales order cannot be approved. Please see Approval Denial Reason on the order.');
						window.location.reload();
						return true;
					}
				}
			}
		}

		//nlapiSubmitField('salesorder',stSalesOrderId,'orderstatus',PENDING_FULFILL);
		nlapiLogExecution('ERROR', 'stSalesOrderId==', stSalesOrderId);
		nlapiLogExecution('ERROR', 'PENDING_FULFILL==', PENDING_FULFILL);
		var recSO = nlapiLoadRecord('salesorder', stSalesOrderId);
		recSO.setFieldValue('orderstatus', PENDING_FULFILL);
		nlapiSubmitRecord(recSO, true);
		nlapiLogExecution('ERROR', 'stSalesOrderId after submit==', stSalesOrderId);
		window.location.reload();
		return true;
	} catch (error) {
		if (error.getDetails != undefined) {
			      logger.error('Process Error',  error.getCode() + ': ' + error.getDetails());
			      return true;
			//throw error;
		} else {
			           logger.error('Unexpected Error', error.toString());
			           return true;
			//throw nlapiCreateError('99999', error.toString());
		}
	}
}



/**
 * The purpose of this script is 
 *
 * @param (string) 
 * @return 
 * @type int
 * @author Regina R. dela Cruz
 * @version 1.0
 */
function beforeLoad_replaceApproveButton(stType, stForm) {//ue before load
	var logger = new Logger();
	var stLoggerTitle = 'beforeLoad_replaceApproveButton';
	logger.enableDebug();

	try {
		if (stType != 'view') {
			return;
		}

		var objContext = nlapiGetContext();
		//var stUser = objContext.getUser();
		//var stUserRole = objContext.getRole();
		var stUserSubsidiary = objContext.getSubsidiary();
		//var paramSubsidiary = objContext.getSetting('SCRIPT', 'custscript_approval_subsidiary');
		var paramSubsidiary = objContext.getSetting('SCRIPT', 'custscript_btn_approval_subsidiary');
		logger.debug(stLoggerTitle, 'user sub = ' + stUserSubsidiary + ' param sub = ' + paramSubsidiary);

		var constBBASubsidiary = 8;//Hong Kong
		var korea_subsidiary = 10;//S.Korea
		// Added to support BBA
		if (stUserSubsidiary == constBBASubsidiary||stUserSubsidiary == korea_subsidiary) {
			var btnApprove = stForm.getButton('approve');
			if (btnApprove) {
				btnApprove.setVisible(false);
			}

			if (nlapiGetFieldValue('status') == 'Pending Approval') {
				stForm.setScript('customscript_so_approval_validation');
				stForm.addButton('custpage_approve', 'Approve', 'setOrderStatusOnApprove()');
			}
		}

		if (stUserSubsidiary == paramSubsidiary) {
			var btnApprove = stForm.getButton('approve');
			if (btnApprove) {
				btnApprove.setVisible(false);
			}

			if (nlapiGetFieldValue('status') == 'Pending Approval') {
				stForm.setScript('customscript_so_approval_validation');
				stForm.addButton('custpage_approve', 'Approve', 'setOrderStatusOnApprove()');
			}
		}
	} catch (e) {
		if (e.getDetails != undefined) {
			logger.error('Process Error', e.getCode() + ': ' + e.getDetails());
			//throw e;
		} else {
			logger.error('Unexpected Error', e.toString());
			//throw nlapiCreateError('99999', e.toString());
		}
	}
}

function inArray(val, arr) {
	var bIsValueFound = false;

	for (var i = 0; i < arr.length; i++) {
		if (val == arr[i]) {
			bIsValueFound = true;
			break;
		}
	}

	return bIsValueFound;
}





function beforeSubmit_SalesOrderApprovalValidatio() { // User event before submit
	var logger = new Logger();
	var stLoggerTitle = 'saveRecord_SalesOrderApprovalValidation';
	var approvalAlert1 = '';
	var approvalAlert2 = '';
	var approvalAlert3 = '';
	var approvalAlert4 = '';
	logger.enableDebug();
	nlapiLogExecution('debug', '-------------- Start --------------', '----recId='+nlapiGetRecordId());
	try {
		var objContext = nlapiGetContext();
		var stUser = objContext.getUser();
		var stUserRole = objContext.getRole();
		var stUserSubsidiary = objContext.getSubsidiary();

		var paramSubsidiary = objContext.getSetting('SCRIPT', 'custscript_approval_subsidiary');
		//       var paramSOApprovalRole = objContext.getSetting('SCRIPT', 'custscript_so_approval_role');
		//       var paramManagerRole = objContext.getSetting('SCRIPT', 'custscript_manager_role');
		var paramCSRRole = objContext.getSetting('SCRIPT', 'custscript_csr_role');
		var paramCSARole = objContext.getSetting('SCRIPT', 'custscript_csa_role');
		var paramAdminRole = objContext.getSetting('SCRIPT', 'custscript_admin_role');

		var arrCSRRole = (paramCSRRole == '' || paramCSRRole == null || paramCSRRole == undefined) ? new Array() : paramCSRRole.split(",");
		var arrCSARole = (paramCSARole == '' || paramCSARole == null || paramCSARole == undefined) ? new Array() : paramCSARole.split(",");
		var arrAdminRole = (paramAdminRole == '' || paramAdminRole == null || paramAdminRole == undefined) ? new Array() : paramAdminRole.split(",");

		var TERMS_PAYMENT_ADV = '69';
		var PENDING_FULFILL = 'B';
		var PENDING_APPROVAL = 'A';

		var constBBASubsidiary = 8; //hong kong
		
		var korea_subsidiary = 10;//KOREA 
		//var arrApprRoles = [3, 1056, 1057, 1059, 1060];
		var arrApprRoles = [3,1058, 1060,1080,1078];//Admin, CHK Admin, CHK Accounting Manager, CKR Admin, CKR ACCOUNTING MANAGER
		var constMinOrderVal = 5000;

		logger.debug(stLoggerTitle, '-------------- Start --------------'+stUserSubsidiary);
		//Adding this check for blocking jackson id 12/30/2016
		//if(stUser != '95619')
		{
		var SOApprovalCheck = nlapiGetFieldValue('custbody_chk_so_approval_check');
		// Added to support BBA
		if ((stUserSubsidiary == constBBASubsidiary||stUserSubsidiary == korea_subsidiary) && SOApprovalCheck == 'T') {
			var stSalesOrderId = nlapiGetRecordId();
			var stNewStatus = nlapiGetFieldValue('orderstatus');
			var flance = forceParseFloat(nlapiGetFieldValue('balance'));
			var flOrdTotal = forceParseFloat(nlapiGetFieldValue('total'));
            var exchrate = forceParseFloat(nlapiGetFieldValue('exchangerate'));
        	var so_currency = nlapiGetFieldValue('currency');
        	nlapiLogExecution('ERROR', 'so_currency', so_currency);
        
			if( exchrate == 0)
				exchrate = 1;
				
							
			var stOldStatus = '';
			if (!isEmpty(stSalesOrderId)) {
				stOldStatus = nlapiLookupField('salesorder', stSalesOrderId, 'status');
			}
			logger.debug(stLoggerTitle, 'stOldStatus = ' + stOldStatus);
			logger.debug(stLoggerTitle, 'stNewStatus = ' + stNewStatus);
			logger.debug(stLoggerTitle, 'stUserRole = ' + stUserRole);

			if (stOldStatus == "pendingFulfillment" || stOldStatus == "Pending Fulfillment" || stOldStatus == "B")
			{
				var reapprovalCheck = 0;
			
				var oldRec = nlapiGetOldRecord();
				var newRec = nlapiGetNewRecord();
				
				var oldTotAmts = oldRec.getFieldValue('total');
				logger.debug(stLoggerTitle, 'oldTotAmts = ' + oldTotAmts);
				var newTotAmts = newRec.getFieldValue('total');
				logger.debug(stLoggerTitle, 'newTotAmts = ' + newTotAmts);
				if(newTotAmts>oldTotAmts)
				{
					var oldLineCount = oldRec.getLineItemCount('item');
					logger.debug(stLoggerTitle, 'oldLineCount = ' + oldLineCount);
					var newLineCount = newRec.getLineItemCount('item');
					logger.debug(stLoggerTitle, 'newLineCount = ' + newLineCount);
					
					if(oldLineCount != newLineCount)
					{
						reapprovalCheck = 1;
					}
					else
					{
						for(var ltm=1;ltm<=newLineCount;ltm++)
							{
							      var oldItem = oldRec.getLineItemValue('item','item',ltm);
							      logger.debug(stLoggerTitle, 'oldItem = ' + oldItem);
							      var newItem = newRec.getLineItemValue('item','item',ltm);
							      logger.debug(stLoggerTitle, 'newItem = ' + newItem);
							      if(oldItem != newItem)
							      {
							    	  reapprovalCheck = 1;
							    	  break;
							      }
							      
							      var oldQty = oldRec.getLineItemValue('item','quantity',ltm);
							      logger.debug(stLoggerTitle, 'oldQty = ' + oldQty);
							      var newQty = newRec.getLineItemValue('item','quantity',ltm);
							      logger.debug(stLoggerTitle, 'newQty = ' + newQty);
							      if(oldQty != newQty)
							      {
							    	  reapprovalCheck = 1;
							    	  break;
							      }
							      
							      var oldAmt = oldRec.getLineItemValue('item','amount',ltm);
							      logger.debug(stLoggerTitle, 'oldAmt = ' + oldAmt);
							      var newAmt = newRec.getLineItemValue('item','amount',ltm);
							      logger.debug(stLoggerTitle, 'newAmt = ' + newAmt);
							      if(oldAmt != newAmt)
							      {
							    	  reapprovalCheck = 1;
							    	  break;
							      }
							}
					}
					if(reapprovalCheck == 1)
					{
						var stCustomer = nlapiGetFieldValue('entity');
						var stCustomerName = nlapiGetFieldText('entity'); // Newly added on Sep 04 2018
						approvalAlert1 = 'Customer: '+stCustomerName+'\n';
						var stTerms = nlapiGetFieldValue('terms');
						var boolPaymentRecd = nlapiGetFieldValue('custbody_bb_payment_recieved');
						 
						var cols = nlapiLookupField('customer', stCustomer, ['creditlimit', 'fxbalance', 'overduebalance', 'custentity9', 'fxunbilledorders','currency','creditholdoverride','daysoverdue']); //Newly added credithold on Sep 04 2018
		                
						var daysOverDue = cols.daysoverdue;//Newly added on Sep 04 2018
						nlapiLogExecution('ERROR', 'daysOverDue', daysOverDue);
						
						
						var primary_currency = cols.currency;
						
						nlapiLogExecution('ERROR', 'primary_currency', primary_currency);
						/*if(so_currency!=primary_currency)
						{
						   
						       if(primary_currency==3&&so_currency==8) // primary in usd and so in hkd- need to convert hkd to usd
						    	   {
						    	   flOrdTotal =    parseFloat(flOrdTotal*7.75169);
						    	   }
						       
						       if(primary_currency==8&&so_currency==3)// primary in hkd and so in usd- need to convert usd to hkd
						    	   {
						    	   flOrdTotal =    parseFloat(flOrdTotal*7.7616);
						    	   }
						}*/

						var exchange_rate1 = 1;
						
						if(so_currency!=primary_currency)
						{
							  
							exchange_rate1 = forceParseFloat(nlapiExchangeRate(so_currency, primary_currency));
						}
						
						nlapiLogExecution('ERROR', 'exchange rate', exchange_rate1);
						
						flOrdTotal = forceParseFloat(flOrdTotal*exchange_rate1);
						
						nlapiLogExecution('ERROR', 'client_SO_AMOUNT_In customer primary_CURRENCY', flOrdTotal);
						
						
						var flUnbilledOrd = forceParseFloat(cols.fxunbilledorders);
						
						nlapiLogExecution('ERROR', 'client_flUnbilledOrd', flUnbilledOrd);
						var flCreditLimit = forceParseFloat(cols.creditlimit);
						
						nlapiLogExecution('ERROR', 'client_flCreditLimit', flCreditLimit);
			    	    var flBalance = forceParseFloat(cols.fxbalance);
			    	    
			    	    nlapiLogExecution('ERROR', 'client_flBalance', flBalance);
						var flOverdueBalance = forceParseFloat(cols.overduebalance);
						var flTotalOpen = flUnbilledOrd + flBalance + flOrdTotal;
						nlapiLogExecution('ERROR', 'client_TotalOpen', flTotalOpen);
						
						var creditHold = cols.creditholdoverride;//Newly added on Sep 04 2018
						nlapiLogExecution('ERROR', 'creditHold', creditHold);
						
						logger.debug(stLoggerTitle, 'stCustomer = ' + stCustomer);
						logger.debug(stLoggerTitle, 'stTerms = ' + stTerms);
						logger.debug(stLoggerTitle, 'flCreditLimit = ' + flCreditLimit);
						logger.debug(stLoggerTitle, 'flBalance = ' + flBalance);
						logger.debug(stLoggerTitle, 'flance = ' + flance);
						logger.debug(stLoggerTitle, 'flOrdTotal = ' + flOrdTotal);
						logger.debug(stLoggerTitle, 'flOverdueBalance = ' + flOverdueBalance);
						logger.debug(stLoggerTitle, 'flUnbilledOrd = ' + flUnbilledOrd);
						logger.debug(stLoggerTitle, 'Intercompany = ' + cols.custentity9);
						logger.debug(stLoggerTitle, 'CreditHold = ' + cols.creditholdoverride);
						
						
						var cal1 = parseFloat(flCreditLimit)-parseFloat(flTotalOpen);
						approvalAlert2 = 'Usable Credit Limit: '+parseFloat(cal1).toFixed(2)+'. Credit Limit: '+flCreditLimit+'. Current Balance: '+flBalance+'. Unbilled Orders: '+flUnbilledOrd+'. \n';
						
						var stAppDenialReason = '';
						
						logger.debug(stLoggerTitle, '');
						if(creditHold != 'T'){          //New added check to skip approval if credit hold is set to off on customer record Sep 04 2018
						if (cols.custentity9 == 'F') {
							if (flOrdTotal < constMinOrderVal) {
								var minorder_alertnote = 'Please note this Order should exeed $5,000 in value';
								if(so_currency == 15&&flOrdTotal <5000000)//korean currency
									{
								 minorder_alertnote = 'Please note this Order should exeed 5 million korea won in value';
								 alert(minorder_alertnote);
									}
								if(so_currency != 15)
								{
							 minorder_alertnote = 'Please note this Order should exeed $5,000 in value';
							 alert(minorder_alertnote);
								}
								// stAppDenialReason = 'Order must exeed $5,000 in value';
							}

							if (flTotalOpen > flCreditLimit) {
								stAppDenialReason = 'Over Credit Limit, ';
								nlapiLogExecution('debug', '-------------- stAppDenialReason --------------', '----stAppDenialReason='+stAppDenialReason);
							}
		                  
							
							
							// old code for overdue
							/*if (flOverdueBalance > 0) {
								stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
							}*/
							
							var credit_total =0;
							
							var overdue_invoice_total = 0;
							
							var filters_transaction = new Array();
							
							filters_transaction.push(new nlobjSearchFilter('entity', null, 'anyof', stCustomer));
							
							filters_transaction.push(new nlobjSearchFilter('status', null, 'anyof', 'CustCred:A','CustInvc:A'));
							
							filters_transaction.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
							
							
							var column_transaction = new Array();
							
							column_transaction.push(new nlobjSearchColumn('fxamount'));
							
						//column_transaction.push(new nlobjSearchColumn('datecreated').setSort(true));
		                  
		                   column_transaction.push(new nlobjSearchColumn('trandate'));
							
							column_transaction.push(new nlobjSearchColumn('type'));
							
							column_transaction.push(new nlobjSearchColumn('daysoverdue').setSort(true));
							
							column_transaction.push(new nlobjSearchColumn('currency'));
							
							column_transaction.push(new nlobjSearchColumn('tranid'));
							
							var transaction_search = nlapiSearchRecord('transaction', null, filters_transaction, column_transaction);
							
							var overdueinv_tranid = new Array();
							    
							 var overdueinv_amount = new Array();
							 
							 var overdueinv_days = new Array();
							
							if (transaction_search!=null)
								{
								     
								              for(var i=0;i<transaction_search.length;i++)
								            	  {
								            	  
								            	            var tran_type = transaction_search[i].getText('type');
								            	            
								            	            //nlapiLogExecution('ERROR', 'tran_type', tran_type);
								            	            
								            	            if(tran_type=='Credit Memo')
								            	            	{
								            	            	
								            	            	var cm_currency = transaction_search[i].getValue('currency');
								            	            	
								            	            	if(cm_currency!=primary_currency)
								            					{
								            						  
								            						exchange_rate1 = forceParseFloat(nlapiExchangeRate(cm_currency, primary_currency));
								            					}
								            	            	
								            	            	else
								            	            		{
								            	            		exchange_rate1 = 1;
								            	            		}
								            	            	
								            	            	credit_total = credit_total + parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1;
								            	            	
								            	            	
								            	            	       
								            	            	}
								            	            
								            	            var invoice_overdue = transaction_search[i].getValue('daysoverdue');
								            	            
								            	            if(tran_type=='Invoice'&&invoice_overdue>=1)
								            	            	{
								            	            	
		                                                          var inv_currency = transaction_search[i].getValue('currency');
								            	            	
								            	            	if(inv_currency!=primary_currency)
								            					{
								            						  
								            						exchange_rate1 = forceParseFloat(nlapiExchangeRate(inv_currency, primary_currency));
								            					}
								            	            	
								            	            	else
								            	            		{
								            	            		exchange_rate1 = 1;
								            	            		}
								            	            	
								            	            	overdue_invoice_total = overdue_invoice_total + parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1;
								            	            	     
								            	            	
								            	            	overdueinv_amount.push(parseFloat(transaction_search[i].getValue('fxamount'))*exchange_rate1);
								            	            	   
								            	                overdueinv_tranid.push(transaction_search[i].getValue('tranid'));
								            	                
								            	                overdueinv_days.push(transaction_search[i].getValue('daysoverdue'));
								            	            	}
								            	            
								            	            
								            	  }//loop
								              
								              
								              nlapiLogExecution('ERROR', 'credit_total', credit_total);
								              
								              nlapiLogExecution('ERROR', 'overdue_invoice_total ', overdue_invoice_total);
								              var cal2 = parseFloat(overdue_invoice_total)-parseFloat(credit_total);
								              approvalAlert3 = 'Overdue Balance: '+parseFloat(cal2).toFixed(2)+'\n';
								              approvalAlert4 = 'Days Overdue: '+daysOverDue+'.';
								              
								              if((overdue_invoice_total+credit_total)>0)// overdue total amount more than credit total amount
								        	  {
								        	  stAppDenialReason = stAppDenialReason + 'Overdue Balance, ';
								        	  nlapiLogExecution('debug', '-------------- stAppDenialReason --------------', '----stAppDenialReason='+stAppDenialReason);
								        	  var check_inv_amount = 0;
								        	  
								        	  for(var i=0;i<overdueinv_amount.length;i++)
								        		  {
								        		  check_inv_amount = check_inv_amount+ parseFloat(overdueinv_amount[i]);
								        		  
								        		  if(check_inv_amount+credit_total>0)
								        			  {
								        			         var inv_tranid =   overdueinv_tranid[i];
								        			         
								        			         nlapiSetFieldValue('custbody_soapproval_overdueinvoice_id', inv_tranid);
								        			         
								        			         var inv_age = overdueinv_days[i];
								        			         
								        			         nlapiSetFieldValue('custbody_soapproval_overdueinvoice_day', inv_age);
								        			         break;
								        			  }
								        		          
								        		  }//loop
								        	  }//overdue condition
								              
								}//end of overdue
							
							}
					}
						nlapiLogExecution('debug', '-------------- stAppDenialReason --------------', '----before set stAppDenialReason='+stAppDenialReason);
						nlapiSetFieldValue('custbody_bb_app_denial_reason', stAppDenialReason);
						nlapiLogExecution('debug', '-------------- stAppDenialReason --------------', '----after set stAppDenialReason='+stAppDenialReason);
						if (!isEmpty(stAppDenialReason)) {
							nlapiLogExecution('debug', '-------------- stAppDenialReason --------------', '----in denial reason check=');
							//if (inArray(stUserRole, arrApprRoles)) {
								nlapiLogExecution('debug', '-------------- stAppDenialReason --------------', '----in user role check=');
									nlapiSetFieldValue('orderstatus', PENDING_APPROVAL);
							//}
						} else
							nlapiSetFieldValue('orderstatus', PENDING_FULFILL);
					}
						
				}

			}
			nlapiSetFieldValue('tobeemailed', 'F');
		}
		
		}


		logger.debug(stLoggerTitle, '-------------- End --------------');
		return true;
	} catch (error) {
		if (error.getDetails != undefined) {
			logger.error('Process Error', error.getCode() + ': ' + error.getDetails());
			return true;
			//throw error;
		} else {
			logger.error('Unexpected Error', error.toString());
			return true;
			//throw nlapiCreateError('99999', error.toString());
		}
	}
}
