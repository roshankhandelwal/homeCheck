$(document).ready(function(){

    let modal = $("#visitModal");
    let openModalBtn = $("#modalBtn");

    openModalBtn.on('click', openModal);

    function openModal() {

      modal.load("visit_modal.html", function() {

        setAppFlow = function(helpSectionText) {

          const config = {
            country: "US",
            currency: "eur",
            paymentMethods: ["card", "sepa_debit"],
            stripeCountry: "DE",
            stripePublishableKey: "_key"
          }

          toastr.options = {
            closeButton : true,
            preventDuplicates : true,
            timeOut : 5000,
            progressBar : true
          }

          // Used to map UI fields to that should be sent to backend
          let mapFields = {

            "address_accomodation" : "address_accomodation",
            "service_name" : "service_name",
            "house_type" : "house_type",
            "house_size" : "house_size",
            "house_furnished" : "house_furnished",
            "date_choice" : "date_choice",

            "house_surface" : "house_surface",
            "inventory_date" : "inventory_date",
            "order_before_date" : "order_before_date",
            "order_garage" : "order_garage",
            "hasGarage" : "hasGarage",
            "order_basement" : "order_basement",
            "hasBasement" : "hasBasement",
            "last_roomer" : "last_roomer",
            "new_tenant" : "new_tenant",
            "hasReadAndAccepted" : "hasReadAndAccepted",
            "total_price" : "total_price",
            "comments" : "comments"
          };


          let price = 0;
          const garage_extra = 20;
          const basement_extra = 30;
          const vat_tax_percent = 19;

          // Selectors
          const step1 = $("#step-1");
          const reserveBtn = $('#reserveBtn');

          const step2 = $("#step-2");
          const previousBtn_1 = $(".previous");
          const bookBtn = $('#bookBtn');
          $( "#datepicker_inventory_date" ).datepicker();
          $( "#datepicker_order_before_date" ).datepicker();
          step2.hide();

          const step3 = $("#step-3");
          step3.hide();

          const step4 = $("#step-4");
          step4.hide();

          let cities;
          let autoCompleteBox ;
          let clientSecret;

          let step1_data = {};
          let step2_data = {};
          let total_price = 0;

          let garageIncluded = false;
          let basementIncluded = false;

          const paymentMethods = {
              card: {
                name: 'Card',
                flow: 'none',
              },
              sepa_debit: {
                name: 'SEPA Direct Debit',
                flow: 'none',
                countries: [
                  'FR',
                  'DE',
                  'ES',
                  'BE',
                  'NL',
                  'LU',
                  'IT',
                  'PT',
                  'AT',
                  'IE',
                  'FI',
                ],
                currencies: ['eur'],
              }
          };

          
          $.ajax({
            type : "GET",
            url : 'http://localhost:3000/',
            success: function(data, textStatus) {
              cities = data;
            },
            error: function (xhr, ajaxOptions, thrownError) {
              console.log(thrownError);
              cities = ["Berlin","Frankfurt am Main","N&uuml;rnberg","Potsdam"];
            }
          });
          

          $.ajax({
            type : "GET",
            url : 'http://localhost:3000/cities/covered',
            success: function(data, textStatus) {
              cities = data['cities'];
            },
            error: function (xhr, ajaxOptions, thrownError) {
              console.log(thrownError);
            }
          });

          /************************ Google Places API **********************/

          $("#zone").hide();

          autoCompleteBox = new google.maps.places.Autocomplete(document.getElementById("addressText"));

          autoCompleteBox.setFields(['address_components']);
          autoCompleteBox.setComponentRestrictions({'country': ['de']});
          autoCompleteBox.strictBounds = true;

          autoCompleteBox.addListener('place_changed', function() {
            let place = autoCompleteBox.getPlace();
            console.log(place);

            // Check for city within range
            stateEligibleComponents = place['address_components'].filter((address, index) => {
              return address.types.indexOf('administrative_area_level_1') != -1;
            });

            console.log(stateEligibleComponents);

            if(stateEligibleComponents.length > 0) {
              let stateSelected = stateEligibleComponents[0]['long_name'];

              if(cities.indexOf(stateSelected) == -1) {
                $("#zone").html(
                  `
                  ${helpSectionText['notPresent']}${cities.join(" , ")}</strong>
                  `
                );
                $("#zone").show();
              } else {
                $("#zone").hide();
              }
            } 

          });

          /************************ Google Places API **********************/


          /************************ Steps Activation **********************/

          activateBackStep = function(stepNumber) {
            activateStep(stepNumber);
          }

          toggleClass = function(currentStep, backStep) {
              $(".step-indicator").map( (index, indicator) => {
                  // Deciding which step is active
                  if(parseInt(indicator.innerText) == parseInt(currentStep))
                      $(indicator).addClass('active');
                  else 
                      $(indicator).removeClass('active');

                  // Deciding which step is completed
                  if(parseInt(indicator.innerText) < parseInt(currentStep)) {
                    $(indicator).addClass('complete');
                  }
                  else {
                    $(indicator).removeClass('complete');
                  }
              });

              $('.step-indicator.complete').map((index, step) => { 
                if(backStep) {
                  $(step).off();
                  $(step).click(function() { 
                    activateStep(parseInt(step.innerText));
                  }); 
                } else {
                  $(step).off();
                }
                
              });                   
          }

          setupStep = function(stepNumber) {

            if(stepNumber == 2) {  
              
              let service_name = step1_data['service_name'];
              let house_furnished = step1_data['house_furnished'];

              /** 
               * Date before which the inventory must be made is shown. ( shown with We organize - removed with I will choose )
               * Exit selected => Date on which the inventory of the places of entry was made and "Add a State of entry":
               * Furnished => Add Inventory
               * Entry Exit => New Tenant
               * 
              */
              
              if(step1_data['date_choice'] == "nocalendar") {
                $(".inventory_date_must_section").show();
              } else {
                  $(".inventory_date_must_section").hide();
              }

              if(step1_data['service_name'] !== "entry") {
                $(".inventory_date_was_section").show();
                $(".entry_state").show();
              } else {
                $(".inventory_date_was_section").hide();
                $(".entry_state").hide();
              }

              
              if(step1_data['service_name'] == "entryExit") {
                $(".new_tenant_details").show();
              } else {
                $(".new_tenant_details").hide();
              }

              if(step1_data['house_furnished'] == "furnished") {
                $(".inventory_add").show();
              } else {
                $(".inventory_add").hide();
              }


              // also make the call to get the Price Detail
              let reason = 0;
              if(service_name === "entry" && house_furnished == "notfurnished")
                reason = 2;
              else if(service_name === "exit" && house_furnished == "notfurnished")
                reason = 1;
              else if(service_name === "entryExit" && house_furnished == "notfurnished")
                reason = 3;
              else if(service_name === "entry" && house_furnished == "furnished")
                reason = 5;
              else if(service_name === "exit" && house_furnished == "furnished")
                reason = 4;
              else if(service_name === "entryExit" && house_furnished == "furnished")
                reason = 6;


              $.ajax({
                url: "http://localhost:3000/prices",
                data: {estate_type : step1_data['house_type'] , estate_size : step1_data['house_size'] , estate_visit_reason : reason},
                dataType: "json",
                success: function(data, textStatus) {
                  console.log(data);
                  price = data['price'];
                  updatePriceSection(price, null);
                  
                  if(step2_data['hasGarage'] && step2_data['hasGarage'] == "true") {
                    $(".garage_detail").show();
                    garagePriceUpdate(step2_data['hasGarage']);
                  } else {
                    $(".garage_detail").hide();
                  }
                  
                  if(step2_data['hasBasement'] && step2_data['hasBasement'] == "true") {
                    $(".cellar_detail").show();
                    basementPriceUpdate(step2_data['hasBasement']);
                  } else {
                    $(".cellar_detail").hide();
                  }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                  console.log(thrownError);
                  updatePriceSection(0, null);
                }
              });
            }
          }


          activateStep = function(stepNumber) {
            let i = 1;
            for(i; i <=4; i++) {
              const stepId = "#step-" + i;
              if(i === stepNumber) {
                currentStep = stepNumber;
                toggleClass(currentStep, stepNumber !== 4);
                $(stepId).show();
                setupStep(stepNumber);
              } else {
                $(stepId).hide();
              }
            }
          }


          /************************ Steps Activation **********************/



          showFinalScreen = function(userStatus) {

            activateStep(4);

            step4.find('.message').html(`${userStatus['paymentMsg']}. <br/> ${userStatus['msg']}`);
            step4.find('.message').addClass(userStatus['status']);

            if(userStatus['uuid']) {
              step4.find('.responseKey').html(`UUID`);
              step4.find('.responseId').html(userStatus['uuid']);
            } else {
              step4.find('.responseKey').html("ProblemID");
              step4.find('.responseId').html(userStatus['problemId']);
            }
            
          }

          let currentStep = 1;
          toggleClass(currentStep);



          /*********** STEP 1 Interactions Begin******************************/

          $("input[name='service_name']").on('change', event => {
              event.preventDefault();
              let serviceNameSelected = event.target.value;
              if(serviceNameSelected == "entryExit") {
                $(".info-help.inventory_type").html( 
                  ` ${helpSectionText['inventory_type']}
                `);
              } else {
                $(".info-help.inventory_type").html("");
              }
          }); 


          $("input[name='house_size']").on('change', event => {
              event.preventDefault();
              let housingTypeSelected = event.target.id;
              $(".info-help.housing_type").html( 
              ` <span class="input-icon glyphicon glyphicon-info-sign" aria-hidden="true"></span>
                <span>
                  <div class="title">${housingTypeSelected}</div>: ${helpSectionText['infoHelp'][housingTypeSelected]}
                </span>
              `);
          });


          $("input[name='date_choice']").on('change', event => {
              event.preventDefault();
              let dateChoice = event.target.value;
              $(".info-help.inventory_date").html( 
              ` <span class="input-icon glyphicon glyphicon-info-sign" aria-hidden="true"></span>
                <span>
                    ${helpSectionText['dateHelp'][dateChoice]}
                </span>
              `);
          });


          garagePriceUpdate = function(hasHouseGarage) {
            if(hasHouseGarage == "true") {

              $(".garage_detail").show();
              price += garage_extra;
              garageIncluded = true;
              updatePriceSection(price, null);

            } else {

              $(".garage_detail").hide();
              if(garageIncluded) {
                garageIncluded = false;
                price -= garage_extra;
                updatePriceSection(price, null);
              }

            }
          }


          basementPriceUpdate = function(hasHouseBasement) {
            if(hasHouseBasement == "true") {

              $(".cellar_detail").show();
              price += basement_extra;
              basementIncluded = true;
              updatePriceSection(price, null);

            } else {
              
              $(".cellar_detail").hide();
              if(basementIncluded) {
                  basementIncluded = false;
                  price -= basement_extra;
                  updatePriceSection(price, null);
              }
            }
          }



          updatePriceSection = function(base_price, travel_price) {

            base_price = parseInt(base_price);
            $(".base_price").html(`${base_price} €`);
            
            let travelExpense;
            if(travel_price) {
              $(".travel_expense").html(`${travel_price} €`);
              travelExpense = travel_price;
            } else {
              travelExpense = $(".travel_expense").html().split(" ")[0];
              travelExpense =  travelExpense != undefined ? parseInt(travelExpense) : 0;
            }
            
            let expense_travelincluded = base_price + travelExpense;
            $(".base_travel_price").html(`${expense_travelincluded} €`);

            // calculation of VAT
            let vat_amount = Math.floor((vat_tax_percent / 100 * expense_travelincluded) * 100)/100;
            $(".vat_amount").html(`${vat_amount} €`);

            total_price = expense_travelincluded + vat_amount;
            total_price = Math.round(total_price * 100)/100;
            $(".total_price").html(`${total_price} €`);

          }

          // On click on reserveBtn, show the More Details page
          reserveBtn.click(function() {
            // Check for validity by accessing all fields and check if they are not null, for anything that is null, show a toastr notification

            step1_data = {};

            let address_accomodation = $("#addressText").val();
            // if(address_accomodation === "") {
            //   toastr.error(`${helpSectionText['alertErrors']['accomodation_address']}`);
            //   return false;
            // } else if($("#zone").css('display') != 'none') {
            //   return false;
            // } else {
            step1_data['address_accomodation'] = address_accomodation;
            // }          
              
            let service_name = $("input[name='service_name']:checked").val();
            if(service_name == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['inventory_type']}`);
              return false;
            } else {
              step1_data['service_name'] = service_name;
            }

            let house_type = $("input[name='house_type']:checked").val();
            if(house_type == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['house_type']}`);
              return false;
            } else {
              house_type = parseInt(house_type);
              step1_data['house_type'] = house_type;
            }

            let house_size = $("input[name='house_size']:checked").val();
            if(house_size == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['house_size']}`);
              return false;
            } else {
              house_size = parseInt(house_size);
              step1_data['house_size'] = house_size;
            }

            let house_furnished = $("input[name='house_furnished']:checked").val();
            if(house_furnished == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['house_furnished']}`);
              return false;
            } else {
              step1_data['house_furnished'] = house_furnished;
            }

            let date_choice = $("input[name='date_choice']:checked").val();
            if(date_choice == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['date_choice']}`);
              return false;
            } else {
              step1_data['date_choice'] = date_choice;
            }
            
            // Replicate the address
            let addressProvided = $("#addressText").clone();
            addressProvided.prop( "disabled", true );
            $(".address-group").find("#addressText").remove();
            $(".address-group").append(addressProvided);

            activateStep(2);

          });

          /*********** STEP 1 Interactions End******************************/

          previousBtn_1.click(function() {
            activateStep(1);
          });


          /*********** STEP 2 Interactions Begin******************************/

          let tenantNumber = 1;

          let tenantTemplate = 
          `
          <div class="form-group tenant-detail">
              <div class="row mt-2">
                  <div class="col-md-6">
                      <span>${helpSectionText['tenant_placeholders']['tenant_number']} <span class="tenantNumber">${tenantNumber}</span></span>
                  </div>
              </div>
              <div class="row mt-2">
                  <div class="col-md-6">
                      <input type="text" placeholder="${helpSectionText['tenant_placeholders']['tenant_name']}" name="tenantName" class="form-control input-lg"
                          aria-required="true" aria-invalid="false">
                  </div>
                  <div class="col-md-6">
                      <input type="text" placeholder="${helpSectionText['tenant_placeholders']['tenant_firstName']}" name="tenantSubname" class="form-control input-lg" 
                          aria-required="true" aria-invalid="false">
                  </div>
              </div>
              <div class="row mt-2">
                  <div class="col-md-6 input-group">
                      <span class="input-group-addon">
                          <span class="input-icon glyphicon glyphicon-envelope" aria-hidden="true"></span>
                      </span> 
                      <input type="email" placeholder="${helpSectionText['tenant_placeholders']['tenant_email']}" name="tenantEmail" 
                          class="form-control input-lg border-left-0" aria-required="true"
                          aria-invalid="false">
                  </div>
                  <div class="col-md-6 input-group">
                      <span class="input-group-addon">
                          <span class="input-icon glyphicon glyphicon-phone" aria-hidden="true"></span>
                      </span> 
                      <input type="tel" placeholder="${helpSectionText['tenant_placeholders']['tenant_telephone']}" name="tenantPhone" 
                          class="form-control input-lg border-left-0" aria-required="true"
                          aria-invalid="false">
                  </div>
              </div>
          </div> 
          `

          $(".tenantDetails").append(tenantTemplate);


          $('#addTenantBtn').click(
            function() {
              tenantNumber = $(".tenant-detail").length + 1;
              tenantTemplate = 
              `
              <div class="form-group tenant-detail">
                <div class="row mt-2">
                    <div class="col-md-6">
                        <span>${helpSectionText['tenant_placeholders']['tenant_number']} <span class="tenantNumber">${tenantNumber}</span></span>
                    </div>
                    <div class="col-md-6">
                        <span class="badge remove_tenant alert alert-info">
                          Remove <span class="glyphicon glyphicon-remove"></span>
                        </span>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-6">
                        <input type="text" placeholder="${helpSectionText['tenant_placeholders']['tenant_name']}" name="tenantName" class="form-control input-lg"
                            aria-required="true" aria-invalid="false">
                    </div>
                    <div class="col-md-6">
                        <input type="text" placeholder="${helpSectionText['tenant_placeholders']['tenant_firstName']}" name="tenantSubname" class="form-control input-lg" 
                            aria-required="true" aria-invalid="false">
                    </div>
                </div>
                  <div class="row mt-2">
                    <div class="col-md-6 input-group">
                        <span class="input-group-addon">
                            <span class="input-icon glyphicon glyphicon-envelope" aria-hidden="true"></span>
                        </span> 
                        <input type="email" placeholder="${helpSectionText['tenant_placeholders']['tenant_email']}" name="tenantEmail" 
                            class="form-control input-lg border-left-0" aria-required="true"
                            aria-invalid="false">
                    </div>
                    <div class="col-md-6 input-group">
                        <span class="input-group-addon">
                            <span class="input-icon glyphicon glyphicon-phone" aria-hidden="true"></span>
                        </span> 
                        <input type="tel" placeholder="${helpSectionText['tenant_placeholders']['tenant_telephone']}" name="tenantPhone" 
                            class="form-control input-lg border-left-0" aria-required="true"
                            aria-invalid="false">
                    </div>
                  </div>
              </div>  
              `
              $(".tenantDetails").append(tenantTemplate);

              $('.remove_tenant').map((index, removeBtn) => {
                $(removeBtn).click(function() {

                  $(removeBtn).closest('.tenant-detail').remove();
                  tenantNumber = tenantNumber - 1;
                  
                  // Select all that exist
                  $(".tenant-detail").map((index, tenantDetail) => {
                    $(tenantDetail).find(".tenantNumber")[0].innerHTML = index+1;
                  });

                });
              });

          });

          // Add a state of entry
          $('#uploadFileCheckin').change(function(e){

            file = e.target.files[0];
            $( "#uploadFileCheckin" ).prev().html(file.name);
            
            // Reading the File.
            fr = new FileReader();
            fr.readAsDataURL(file);
          });


          // Inventory_add
          $('#entryWFurnitureUploadFile').change(function(e){

            file = e.target.files[0];
            $( "#entryWFurnitureUploadFile" ).prev().html(file.name);
            
            // Reading the File.
            fr = new FileReader();
            fr.readAsDataURL(file);
          });


          // Garage Selection
          $("input[name='house_garage']").on('change', event => {
              event.preventDefault();
              let hasHouseGarage = event.target.value;
              step2_data['hasGarage'] = hasHouseGarage;

              garagePriceUpdate(hasHouseGarage);
          }); 

          // Basement Selection
          $("input[name='house_basement']").on('change', event => {
              event.preventDefault();
              let hasHouseBasement = event.target.value;
              step2_data['hasBasement'] = hasHouseBasement;

              basementPriceUpdate(hasHouseBasement);
          });


          let hasReadAndAccepted = false;
          $('#cgv_check').change(event => {
            event.preventDefault();
            hasReadAndAccepted = !hasReadAndAccepted;
          });


          // Check for validity by accessing all fields and check if they are not null, for anything that is null, show a toastr notification
          checkValidityAllInputsStep2 = function() {

            step2_data = {};

            //Check for tenant
            $(".tenant-detail").each((index, tenant) => { 

              step2_data['tenant' + index] = {};
              $(tenant).find("input").each((_ , tenantDataField) => {

                let fieldName = tenantDataField.name;
                if($(tenantDataField).val() === "" || $(tenantDataField).val() === undefined) {
                  toastr.error(`The ${fieldName} of the tenant must be filled`);
                  return false;
                } else {
                  step2_data['tenant' + index][tenantDataField.name] = $(tenantDataField).val();
                }
              });
            });

            // House Surface
            let house_surface = $("input[name=house_surface]").val();
            if(house_surface == "" || house_surface == 0) {

              toastr.error(`${helpSectionText['alertErrors']['housing_area']}`);
              return false;
            } else {

              step2_data['house_surface'] = house_surface;
            }

            // Date before which the inventory must be made
            let inventoryDateDisplay = $(".inventory_date_must_section").css('display');
            if(inventoryDateDisplay !== 'none') {
              let inventory_date = $("input[name=inventory_date]").val();
              if(inventory_date == "") {

                toastr.error(`${helpSectionText['alertErrors']['inventory_date_must_section']}`);
                return false;
              } else {

                step2_data['inventory_date'] = inventory_date;
              }
            }

            // Date on which the inventory of the places of entry was made
            let inventoryDateWasDisplay = $(".inventory_date_was_section").css('display');
            if(inventoryDateWasDisplay !== 'none') {
              let order_before_date = $("input[name=order_before_date]").val();
              if(order_before_date == "") {

                toastr.error(`${helpSectionText['alertErrors']['inventory_date_was_section']}`);
                return false;
              } else {

                step2_data['order_before_date'] = order_before_date;
              }
            }


            // State of entry
            let entryStateDisplay = $(".entry_state").css('display');
            if(entryStateDisplay !== 'none') {
              input = document.getElementById('uploadFileCheckin');
              if (!input || !input.files || !input.files[0]) {
                // toastr.error("Um, couldn't find the fileInput element.");
                // return false;
              } else {
                file = input.files[0];
                step2_data['uploadFileCheckin'] = file.name;
              }
            }

            
            // Has a Garage
            let hasGarage = $("input[name='house_garage']:checked").val();
            if( hasGarage == "true" ) { 
              let order_garage = $("input[name=order_garage]").val();
              if(order_garage == "") {

                toastr.error(`${helpSectionText['alertErrors']['house_garage_location']}`);
                return false;
              } else {
                step2_data['order_garage'] = order_garage;
              }
            }
            if(hasGarage == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['house_garage']}`);
              return false;
            }
            step2_data['hasGarage'] = hasGarage;
                

            // Has a Basement
            let hasBasement = $("input[name='house_basement']:checked").val();
            if( hasBasement == "true" ) {
              let order_basement = $("input[name=order_basement]").val();
              if(order_basement == "") {

                toastr.error(`${helpSectionText['alertErrors']['house_basement_location']}`);
                return false;
              } else {
                step2_data['order_basement'] = order_basement;
              }
            }
            if(hasBasement == undefined) {
              toastr.error(`${helpSectionText['alertErrors']['house_basement']}`);
              return false;
            }
            step2_data['hasBasement'] = hasBasement;


            // Last Tenant
            let last_roomer = $("input[name=last_roomer]").val();
            if(last_roomer == "") {

              toastr.error(`${helpSectionText['alertErrors']['last_roomer']}`);
              return false;
            } else {

              step2_data['last_roomer'] = last_roomer;
            }


            // Inventory Add
            let inventoryAddDisplay = $(".inventory_add").css('display');
            if(inventoryAddDisplay !== 'none') {
              input = document.getElementById('entryWFurnitureUploadFile');
              if (!input || !input.files || !input.files[0]) {
                // toastr.error("Um, couldn't find the fileInput element.");
                // return false;
              } else {
                file = input.files[0];
                step2_data['entryWFurnitureUploadFile'] = file.name;
              }
            }


            // New Tenant Detail
            let newTenantDetailsDisplay = $(".new_tenant_details").css('display');
            if(newTenantDetailsDisplay !== 'none') {

              step2_data['new_tenant'] = {};
              $(".new_tenant_details").find("input").each((_ , newTenantDataField) => {

                let fieldName = newTenantDataField.name;
                if($(newTenantDataField).val() === "" || $(newTenantDataField).val() === undefined) {
                  toastr.error(`The ${fieldName} of the new Tenant must be filled`);
                  return false;
                } else {
                  step2_data['new_tenant'][newTenantDataField.name] = $(newTenantDataField).val();
                }
              });
            }

            //Comments
            step2_data['comments'] = $("#comment").val();

            if(!hasReadAndAccepted) {
              toastr.error(`${helpSectionText['alertErrors']['readAndAccepted']}`);
              return false;
            } else {
              step2_data['hasReadAndAccepted'] = hasReadAndAccepted;
            }
            
            return true;
          }


          // On click on bookBtn, show the Payment page
          bookBtn.click(function() {

            //let isStep2Valid = true;
            let isStep2Valid = checkValidityAllInputsStep2();

            console.log(step1_data);

            // Also adding the price to pay.
            step2_data['total_price'] = total_price;

            console.log(step2_data);

            if(isStep2Valid) {
              activateStep(3);
              setUpPaymentInformation();
            }
          });

          /*********** STEP 2 Interactions Ends******************************/


          /************ STEP 3 Interaction Begin ****************************/


          mapUserData = function(step1_data, step2_data)  {

            let userData = {};
            for(let key of Object.keys(step1_data)) {
              if(mapFields[key])
                userData[mapFields[key]] = step1_data[key];
              else 
                userData[key] = step1_data[key];
            }

            for(let key of Object.keys(step2_data)) {
              if(mapFields[key])
                userData[mapFields[key]] = step2_data[key];
              else 
                userData[key] = step2_data[key];
            }

            return userData;
          }


          // Once the Payment is successful, Make a call to Backend to confirm booking.
          confirmBooking = function() {

            $.ajax({
              url : 'http://localhost:3000/bookings/create/success',
              type : "POST",
              data : mapUserData(step1_data, step2_data),
              success : function(data, textStatus, jqXhr) {
                console.log(data);
                let userStatus;
                if(data['success']) {
                  userStatus = {
                    uuid : data["UUID"], 
                    msg : data['Message'], 
                    status : 'alert alert-success',
                    paymentMsg : `Your payment of <strong>${step2_data['total_price']} €</strong> was <i>successfully processed</i>` 
                  }
                  showFinalScreen(userStatus);
                } else {
                  userStatus = {
                    problemId : data["problem_id"], 
                    msg : data['Message'], 
                    status : 'alert alert-warning',
                    paymentMsg : `Your payment of <strong>${step2_data['total_price']} €</strong> was <i>successfully processed</i>` 
                  }
                  showFinalScreen(userStatus);
                }
              },
              error : function( jqXhr, textStatus, errorThrown) {
                console.log(textStatus);
                userStatus = {
                  problemId : "Systems Failure", 
                  msg : "Your payment has been received. However the booking could not be saved. Please contact us.", 
                  status : 'alert alert-danger',
                  paymentMsg : `Your payment of <strong>${step2_data['total_price']} €</strong> was <i>successfully processed</i>` 
                }
                showFinalScreen(userStatus);
              }
            });
          }

          // Payment information and interaction
          setUpPaymentInformation = function() {

            // Reset the Payment area
            $('#payment-form-stripe').hide();
            $('#paypal-area').hide();

            $("input[name='paymentOption']").prop('checked', false)

            setUpStripe = function() {

              const form = document.getElementById('payment-form-stripe');
              const payBtn = $('#payBtn');
              payBtn.prop('disabled', false);

              let stripe = Stripe(config.stripePublishableKey);
              let elements = stripe.elements();
              
              let countrySelected = config.country;
              let payBtnLabelPrev = "";

              $('#card-errors').hide();
              $('#iban-errors').hide();

              
              $("select[name=country]").off();
              $("select[name=country]").on('change', event => {
                  event.preventDefault();
                  countrySelected = event.target.value;
                  selectCountry(event.target.value);
              });

              // Starting with payment Intent 
              // Fetching Client Secret
              if(clientSecret !== undefined) {
                // Update
                stripe.retrievePaymentIntent(
                  clientSecret
                ).then(function(result) {
                  console.log(result);
                  $.ajax({
                    url : 'http://localhost:3000/payment/update',
                    type : "POST",
                    data : {"amount": step2_data['total_price'], "currency": "EUR", "payId" : result.paymentIntent.id},
                    success : function(data, textStatus, jqXhr) {
                      clientSecret = data['client_secret'];
                    },
                    error : function( jqXhr, textStatus, errorThrown) {
                      console.log(textStatus);
                    }
                  });
                });
                
              } else {
                // Create
                $.ajax({
                  url : 'http://localhost:3000/payment/create',
                  type : "POST",
                  data : {"amount": step2_data['total_price'], "currency": "EUR"},
                  success : function(data, textStatus, jqXhr) {
                    clientSecret = data['client_secret'];
                  },
                  error : function( jqXhr, textStatus, errorThrown) {
                    console.log(textStatus);
                  }
                });
              }
              
              // Stripe Card
              const cardElement = elements.create('card');
              $('#stripe-card').empty();
              cardElement.mount('#stripe-card');


              // IBAN Element
              const ibanOptions = {
                  supportedCountries: ['SEPA'],
              };
              const iban = elements.create('iban', ibanOptions);
              
              // Mount the IBAN Element on the page.
              $('#iban-element').empty();
              iban.mount('#iban-element');


              // Update the main button to reflect the payment method being selected.
              const updateButtonLabel = (paymentMethod, bankName) => {

                  let amount = step2_data['total_price'];

                  let name = paymentMethods[paymentMethod].name;
                  let label = `Pay <strong>${amount} €</strong>`;

                  if (paymentMethod !== 'card') {
                      label = `Pay <strong>${amount} €</strong> with ${name}`;
                  }
                  if (paymentMethod === 'sepa_debit' && bankName) {
                      label = `Debit ${amount} from ${bankName}`;
                  }
                  payBtn.html(label);
              };


              const selectCountry = country => {
                  const selector = document.getElementById('country');
                  selector.querySelector(`option[value=${country}]`).selected = 'selected';
                  selector.className = `field ${country}`;
              
                  // Trigger the methods to show relevant fields and payment methods on page load.
                  // showRelevantFormFields();
                  showRelevantPaymentMethods();
              };

              const showRelevantPaymentMethods = country => {
                if (!country) {
                  country = form.querySelector('select[name=country] option:checked').value;
                }

                // Decides which of the payment options to show
                const paymentInputs = form.querySelectorAll('input[name=payment]');
                for (let i = 0; i < paymentInputs.length; i++) {
                  let input = paymentInputs[i];
                  input.parentElement.classList.toggle(
                    'visible',
                    input.value === 'card' ||
                      (config.paymentMethods.includes(input.value) &&
                        paymentMethods[input.value].countries.includes(country) &&
                        paymentMethods[input.value].currencies.includes(config.currency))
                  );
                }
            
                // Hide the tabs if card is the only available option.
                const paymentMethodsTabs = document.getElementById('payment-methods');
                paymentMethodsTabs.classList.toggle(
                  'visible',
                  paymentMethodsTabs.querySelectorAll('li.visible').length > 1
                );
            
                // Check the first payment option again.
                paymentInputs[0].checked = 'checked';
                form.querySelector('.payment-info.payment_card').classList.add('visible');
                form.querySelector('.payment-info.payment_sepa_debit').classList.remove('visible');
                updateButtonLabel(paymentInputs[0].value);
              };

              
              // Listen to changes to the payment method selector.
              $("input[name='payment']").off();
              
              $("input[name='payment']").on('change', event => {
                  event.preventDefault();
                  let payment = event.target.value;
                  console.log(payment);

                  // Update button label.
                  updateButtonLabel(payment);

                  // Show the relevant details, whether it's an extra element or extra information for the user.
                  form
                    .querySelector('.payment-info.payment_card')
                    .classList.toggle('visible', payment === 'card');
                  form
                    .querySelector('.payment-info.payment_sepa_debit')
                    .classList.toggle('visible', payment === 'sepa_debit');
                  document
                    .getElementById('card-errors')
                    .classList.remove('visible', payment !== 'card');

              });

              // for (let input of document.querySelectorAll('input[name=payment]')) {
                
              //   input.addEventListener('change', event => {
              //     event.preventDefault();
              //     const payment = form.querySelector('input[name=payment]:checked').value;
                  
              //     // Update button label.
              //     updateButtonLabel(event.target.value);
            
              //     // Show the relevant details, whether it's an extra element or extra information for the user.
              //     form
              //       .querySelector('.payment-info.payment_card')
              //       .classList.toggle('visible', payment === 'card');
              //     form
              //       .querySelector('.payment-info.payment_sepa_debit')
              //       .classList.toggle('visible', payment === 'sepa_debit');
              //     document
              //       .getElementById('card-errors')
              //       .classList.remove('visible', payment !== 'card');
              //   });
              // }

              let country = config.country;
              if($('select[name=country]').val() !== undefined) {
                country = $('select[name=country]').val();
              }
              selectCountry(country);

              // Handle Payment Response
              const handlePayment = ( paymentResponse , errorAreaId ) => {

                const {paymentIntent, error} = paymentResponse;
                if (error) {
                  $('#' + errorAreaId).html(
                    `${error.message}`
                  );
                  payBtn.prop('disabled', false);
                  payBtn.html(payBtnLabelPrev);

                  $('#' + errorAreaId).show();
                } else if (paymentIntent.status === 'succeeded') {
                  // Success! Payment is confirmed. Update the interface to display the confirmation screen.

                  payBtn.prop('disabled', false);
                  // Take the user to the next screen - Confirmation

                  // Make a call to the service to save the data
                  confirmBooking();


                } else if (paymentIntent.status === 'processing') {
                  // Success! Now waiting for payment confirmation. Update the interface to display the confirmation screen.
                  // Take the user to the next screen - We’ll send your receipt and ship your items as soon as your payment is confirmed.
                } else {

                  // Payment has failed.
                  payBtn.prop('disabled', false);
                  payBtn.html(payBtnLabelPrev);

                  $('#' + errorAreaId).html(
                    `Sorry! It looks like your order could not be paid at this time. Please try again or select a different payment option.`
                  );
                }
              };

              payBtn.off();
              payBtn.click(async event =>  {

                event.preventDefault();
    
                let payment_username = $("input[name=payment_username]").val();
                if(payment_username == "") {
                  toastr.error(`${helpSectionText['alertErrors']['payeeName']}`);
                  return false;
                }
    
                let payment_email = $("input[name=payment_email]").val();
                if(payment_email == "") {
                  toastr.error(`${helpSectionText['alertErrors']['payeeEmail']}`);
                  return false;
                }
    
                let payment_address = $("input[name=payment_address]").val();
                if(payment_address == "") {
                  toastr.error(`${helpSectionText['alertErrors']['payeeAddress']}`);
                  return false;
                }
    
                let payment_city = $("input[name=payment_city]").val();
                if(payment_city == "") {
                  toastr.error(`${helpSectionText['alertErrors']['payeeCity']}`);
                  return false;
                }
    
                let postal_code = $("input[name=postal_code]").val();
                if(postal_code == "") {
                  toastr.error(`${helpSectionText['alertErrors']['payeeCode']}`);
                  return false;
                }
    
                payBtn.prop('disabled', true);
                payBtnLabelPrev = payBtn.html();
                payBtn.html(`${helpSectionText['processingText']}`);
    
                let paymentModeSelected = $("input[name=payment]:checked").val();
                console.log(paymentModeSelected);

                if(paymentModeSelected === 'card') {
    
                    stripeResponse = await stripe.handleCardPayment(
                      clientSecret, cardElement, {
                        payment_method_data: {
                          billing_details: {
                            name: payment_username,
                            email : payment_email,
                            address : {
                              city : payment_city,
                              country : countrySelected,
                              line1 : payment_address,
                              postal_code : postal_code
                            }
                          }
                        }
                      }
                    );
      
                    console.log(stripeResponse);
                    handlePayment(stripeResponse, 'card-errors');

                } else if(paymentModeSelected === 'sepa_debit') {

                  let sourceData = {
                    type: 'sepa_debit',
                    currency: 'eur',
                    owner: {
                      name: payment_username,
                      email : payment_email,
                      address : {
                        city : payment_city,
                        country : countrySelected,
                        line1 : payment_address,
                        postal_code : postal_code
                      }
                    },
                    mandate: {
                      // Automatically send a mandate notification email to your customer
                      // once the source is charged.
                      notification_method: 'email',
                    },
                  };

                  ibanStripeResponse = await stripe.createSource(iban, sourceData);

                  console.log(ibanStripeResponse);
                  handlePayment(ibanStripeResponse, 'iban-errors');
                }
                
              });


            }

            setUpPaypal = function() {

              $(".paypal-label").html(`Payment Amount <strong>${step2_data['total_price']} €</strong>`)
              $('#paypal-container').empty();
              
              paypal.Buttons({
                createOrder: function(data, actions) {
                      // Set up the transaction
                      return actions.order.create({
                          purchase_units: [{
                          amount: {
                              value: step2_data['total_price']
                          }
                          }]
                      });
                  },
                  onApprove: function(data, actions) {
                      // Capture the funds from the transaction
                      return actions.order.capture().then(function(details) {
                          // Show a success message to your buyer
                          console.dir(details);
                          console.log('Transaction completed by ' + details.payer.name.given_name);
                          // return fetch('/paypal-transaction-complete', {
                          //     method: 'post',
                          //     headers: {
                          //         'content-type': 'application/json'
                          //     },
                          //     body: JSON.stringify({
                          //         orderID: data.orderID
                          //     })
                          // });
                      });
                  }
              }).render('#paypal-container');
            }

            // Remove any other events that were associated
            $("input[name='paymentOption']").off();
              
            $("input[name='paymentOption']").on('change', event => {
                event.preventDefault();
                let paymentOptionSelected = event.target.value;
                console.log(paymentOptionSelected);

                if(paymentOptionSelected == "paypal") {
                  $('#payment-form-stripe').hide();
                  $('#paypal-area').show();
                  setUpPaypal();
                } else if(paymentOptionSelected == "stripe") {
                  $('#paypal-area').hide();
                  $('#payment-form-stripe').show();
                  setUpStripe();
                }
            });

          }


          let cancelBtn = $("#cancelBtn");
          cancelBtn.on('click', closeModal); 

          let closeFromStep4 = $("#closeFromStep4");
          closeFromStep4.on('click', closeModal); 
        }

        $.getJSON("text.json", function(json) {
          console.log(json); // show the JSON file content into console
          setAppFlow(json['help']);
        });

        let closeBtn = $("#closeBtn");
        closeBtn.on('click', closeModal);

        modal.show();

      }); // end of load function

    }

    function closeModal() {
        // modal.style.display = "none";
        modal.hide();
    }

}); // end of document Ready


