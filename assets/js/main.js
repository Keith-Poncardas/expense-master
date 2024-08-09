// Program Title : TaskTally
// Programmer & Author : Keith Ralph Robles Poncardas
// Programming Language : Vanilla JavaScript
// Deployment Date : July 31, 2024

document.addEventListener("DOMContentLoaded", () => {
  // References to various DOM elements used in the application
  const inputValidationAlert = document.getElementById('inputValidationAlert');
  const expenseNameInput = document.getElementById('expenseNameInput');
  const costInput = document.getElementById('costInput');
  const quantityInput = document.getElementById('quantityInput');
  const totalExpensesDisplay = document.getElementById('totalExpenses');
  const addExpenseButton = document.getElementById('addExpense');
  const clearAllExpensesButton = document.getElementById('clearAllExpenses');
  const emptyAlert = document.getElementById('emptyAlert');
  const expenseList = document.getElementById('expenseList');
  const searchFilter = document.getElementById('searchFilter');
  const dateFilter = document.getElementById('filterDate');
  const exportButton = document.getElementById('export');

  // Retrieve 'expenses' from localStorage and parse it into a JavaScript object. 
  // If 'expenses' is not found, initialize it as an empty array.
  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

  // Function to save the 'expenses' array to localStorage
  const saveExpenses = () => {
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }

  // Function to clear the values of multiple input or textarea elements
  const clearInputs = (...inputs) => {
    inputs.forEach(input => {
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        input.value = "";
      } else {
        console.warn("Element is not an input or textarea:", input);
      }
    });
  };

  // Function to clear all expenses from the list
  const clearExpenses = () => {
    if (Array.isArray(expenses)) {
      expenses.length = 0; // Empty the expenses array
      console.log("Expenses cleared.");
    } else {
      console.error("Expenses is not an array.");
    }
  };

  // Function to format a number with commas and two decimal places
  const formatNumberWithCommas = (input) => {
    const number = parseFloat(input);

    if (isNaN(number)) {
      console.error('Input cannot be converted to a valid number');
      return '';
    }

    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };


  const formatNumber = (event) => {
    let value = event.target.value;

    // Remove any non-digit and non-decimal characters, allow only one decimal point
    value = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

    // Split the input into integer and decimal parts
    let [integer, decimal] = value.split('.');

    // Format the integer part with commas
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Limit the decimal part to two digits
    if (decimal) {
      decimal = decimal.substring(0, 2);
    }

    // Combine integer and decimal parts
    const formattedValue = decimal !== undefined ? `${integer}.${decimal}` : integer;

    // Update the input field value
    event.target.value = formattedValue;
  };

  const convertToNumber = (input) => {
    // Remove commas and convert to a number
    const number = Number(String(input).replace(/,/g, ''));

    // Check if the conversion was successful and return the number or null
    return isNaN(number) ? (console.error('Input cannot be converted to a valid number'), null) : number;
  };

  const numberToWords = (num) => {
    if (num === 0) return "Zero";

    const belowTwenty = [
      "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    const aboveHundred = [
      "", "Thousand", "Million", "Billion", "Trillion"
    ];

    const convertBelowHundred = (n) => {
      if (n < 20) return belowTwenty[n];
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      return tens[ten] + (unit ? " " + belowTwenty[unit] : "");
    };

    const convertBelowThousand = (n) => {
      if (n < 100) return convertBelowHundred(n);
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      return belowTwenty[hundred] + " Hundred" + (remainder ? " " + convertBelowHundred(remainder) : "");
    };

    const convertNumberToWords = (n) => {
      let result = "";
      let i = 0;

      while (n > 0) {
        if (n % 1000 !== 0) {
          result = convertBelowThousand(n % 1000) + " " + aboveHundred[i] + " " + result;
        }
        n = Math.floor(n / 1000);
        i++;
      }

      return result.trim();
    };

    // Clean up the result to ensure no extra spaces are present
    return convertNumberToWords(num).replace(/\s+/g, ' ');
  };

  const truncateText = (text, maxLength) => {
    // Check if the text length exceeds the maximum length
    if (text.length > maxLength) {
      // Truncate text and append ellipsis
      return text.slice(0, maxLength - 3) + '...';
    }
    // Return the original text if it's within the limit
    return text;
  };

  // Filter function
  const formatDateToDDMMYYYY = (dateString) => {
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const removePointAndFollowingDigit = (inputValue) => {
    return inputValue.replace(/(\d*)\.(\d)/g, (match, p1, p2) => p1);
  };

  const removeNegativeSigns = (inputValue) => {
    return inputValue.replace(/-/g, ''); // Replace all negative signs with an empty string
  };

  const filterExpenses = (expensesArr, searchExpense, datePicker) => {
    // Convert datePicker value to DD/MM/YYYY if it's not empty
    const formattedDatePicker = datePicker ? formatDateToDDMMYYYY(datePicker) : '';

    const searchLower = searchExpense.toLowerCase();

    return expensesArr.filter((expense) => {
      const expenseName = typeof expense.name === "string" ? expense.name.toLowerCase() : "";
      const expenseDate = typeof expense.date === "string" ? expense.date : ""; // Assuming expense.date is in DD/MM/YYYY format

      // Check if expense matches search term
      const matchesSearch = expenseName.includes(searchLower);

      // Check if expense matches date filter (or if date filter is not set)
      const matchesDate = !formattedDatePicker || expenseDate === formattedDatePicker;

      // Return true if either search or date matches
      return matchesSearch && matchesDate;
    });
  };

  // Function to render and display the list of expenses, updating the total as it goes
  const renderExpense = () => {
    expenseList.innerHTML = "";

    // Filter the expenses based on search term and selected date
    const filteredExpenses = filterExpenses(expenses, searchFilter.value, dateFilter.value);

    // Render the filtered list of expenses
    filteredExpenses.forEach((expense) => {
      updateTotal(); // Assuming this updates the total based on filtered expenses
      expenseList.appendChild(addExpenseToList(expense));
    });
  };

  // Function to add a new expense, update the list, and clear input fields
  const addExpense = () => {
    // Get and trim expense name
    const expenseName = expenseNameInput.value.trim();

    // Convert cost input to a number
    const expenseAmount = convertToNumber(costInput.value);

    // Parse quantity input as float, default to 1 if invalid
    let expenseQuantity = parseFloat(quantityInput.value) || 1;

    // Format Date
    function formatDate(timestamp) {
      const date = new Date(timestamp);

      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };

      return date.toLocaleDateString('en-US', options);
    }

    // Calculate total cost
    const totalCost = expenseAmount * expenseQuantity;

    const calendarDate = new Date(); // Calendar date

    // Validate inputs
    if (expenseName && expenseAmount > 0) {
      // Create expense object
      const expense = {
        id: Date.now(),
        name: expenseName,
        originalAmount: expenseAmount,
        amount: totalCost,
        quantity: expenseQuantity,
        formattedDate: formatDate(calendarDate),
        date: new Date().toLocaleDateString(), // Calendar date
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) // Time in 12-hour format
      };

      // Add expense to the list and update the UI
      expenses.push(expense);
      saveExpenses();
      renderExpense();
      updateTotal();
      clearInputs(expenseNameInput, costInput, quantityInput);
    } else {
      // Display an alert for invalid inputs
      alertMessage('Please fill in both the text and number fields with valid values.', 'alert-danger', inputValidationAlert);
    }
  };

  // Function to create a table row for an expense
  const addExpenseToList = (expense) => {
    // Create a new table row
    const row = document.createElement("tr");
    row.dataset.id = expense.id;

    // Validate expense.amount before using toFixed()
    const amount = parseFloat(expense.originalAmount);
    const formattedAmount = isNaN(amount) ? '0.00' : formatNumberWithCommas(amount.toFixed(2));

    // Set the inner HTML for the table row
    row.innerHTML = `
      <td class="text-break fw-medium text-capitalize popover-trigger">
        ${truncateText(expense.name, 35)}
      </td>
      <td>
        <span class="badge text-bg-warning">
          <i class="fa-solid fa-peso-sign"></i> ${formattedAmount}
        </span>
      </td>
      <td>
        <span class="badge text-bg-light">
          ${expense.quantity}
        </span>
      </td>
      <td class="text-break fw-medium text-capitalize"><span class="badge text-bg-info">${expense.formattedDate}</span></td>
      <td class="text-break fw-medium text-capitalize"><span class="badge text-bg-success">${expense.timestamp}</span></td>
      <td>
        <div class="d-flex mx-1">
          <button type="button" class="btn btn-outline-info btn-sm me-1 edit-expense" title="Edit Expense" data-id="${expense.id}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn btn-outline-danger btn-sm delete-expense" title="Delete (${expense.name})" data-id="${expense.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;

    // Return the created row element
    return row;
  };


  // Flag to indicate if the modal is open
  let isModalOpen = false;

  // Global keydown event listener
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !isModalOpen) {
      addExpense();
    }
  });

  // Function to handle the editing of an expenses (Modal)
  const editExpense = (id) => {
    const expense = expenses.find((expense) => expense.id === id);

    if (expense) {
      // Remove existing modal if it exists
      const existingModal = document.getElementById("editExpenseModal");
      if (existingModal) {
        existingModal.remove();
      }

      // Create the modal container
      const modalBackdrop = document.createElement("div");
      modalBackdrop.classList.add("modal", "fade");
      modalBackdrop.id = "editExpenseModal";
      modalBackdrop.tabIndex = "-1";
      modalBackdrop.setAttribute("aria-labelledby", "editExpenseModalLabel");
      modalBackdrop.setAttribute("aria-hidden", "true");

      // Set the modal's inner HTML
      modalBackdrop.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editExpenseModalLabel">Edit Expense</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" title="Cancel"></button>
          </div>
          <div class="modal-body">
            <div id="inputValidationAlertModal" role="alert"></div>
            <div class="mb-3">
              <label for="editExpenseName" class="form-label">Expense Name</label>
              <input type="text" class="form-control" id="editExpenseName" value="${truncateText(expense.name)}">
            </div>
            <div class="mb-3">
              <label for="editExpenseAmount" class="form-label">Expense Amount</label>
              <input type="text" class="form-control" id="editExpenseAmount" value="${formatNumberWithCommas(expense.originalAmount)}">
            </div>
            <div class="mb-3">
              <label for="editExpenseQuantity" class="form-label">Expense Quantity</label>
              <input type="number" class="form-control" id="editExpenseQuantity" value="${expense.quantity}">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success btn-sm" id="saveChangesButton">Save Changes</button>
            <button type="button" class="btn btn-danger btn-sm" id="deleteButton">Delete</button>
          </div>
        </div>
      </div>
    `;

      // Append the modal to the body
      document.body.appendChild(modalBackdrop);

      // Instantiate and show the modal using Bootstrap's Modal class
      const bsModal = new bootstrap.Modal(modalBackdrop);
      bsModal.show();

      // Set flag to indicate the modal is open
      isModalOpen = true;

      // Handle saving changes
      const saveChangesButton = document.getElementById("saveChangesButton");
      const inputValidationAlertModal = document.getElementById("inputValidationAlertModal");

      // Function to handle saving expense changes
      const saveExpenseChanges = () => {
        const updatedName = document.getElementById("editExpenseName").value;
        const updatedAmount = convertToNumber(document.getElementById("editExpenseAmount").value);
        const updatedQuantity = parseFloat(document.getElementById("editExpenseQuantity").value);

        // Update the expense in the array
        const expenseIndex = expenses.findIndex(exp => exp.id === id);
        if (expenseIndex !== -1) {

          let isValidChange = true;
          if (updatedAmount !== null && updatedAmount > 0 && updatedName) {
            expenses[expenseIndex].originalAmount = updatedAmount;
            expenses[expenseIndex].name = updatedName.trim() !== "" ? updatedName.trim() : expenses[expenseIndex].name;
          } else {
            isValidChange = false;
            alertMessage('Please fill in both the text and number fields with valid values.', 'alert-danger', inputValidationAlertModal);
          }

          // Update the quantity if it's a valid number
          if (!isNaN(updatedQuantity) && updatedQuantity > 0) {
            expenses[expenseIndex].quantity = updatedQuantity;
          }

          // Recalculate the total cost based on the original amount and updated quantity
          expenses[expenseIndex].amount = expenses[expenseIndex].originalAmount * expenses[expenseIndex].quantity;

          if (isValidChange) {
            saveExpenses();
            renderExpense();
            updateTotal();
            bsModal.hide(); // Hide the modal after saving
          }
        }
      };

      // Handle saving changes when clicking the save button
      saveChangesButton.addEventListener("click", saveExpenseChanges);

      // Handle Enter key press to save changes
      modalBackdrop.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault(); // Prevent the default form submission
          saveExpenseChanges();
        }
      });

      // Handle deletion
      const deleteButton = document.getElementById("deleteButton");
      deleteButton.addEventListener("click", () => {
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses();
        renderExpense();
        updateTotal();
        bsModal.hide(); // Hide the modal
      });

      editExpenseAmount.addEventListener("input", formatNumber);

      // Remove the modal from the DOM when hidden
      modalBackdrop.addEventListener("hidden.bs.modal", () => {
        modalBackdrop.remove();
        // Reset flag when modal is closed
        isModalOpen = false;
      });

      editExpenseQuantity.addEventListener("input", () => {
        const cleanedValue = removePointAndFollowingDigit(editExpenseQuantity.value);
        editExpenseQuantity.value = cleanedValue; // Update the input field value
      });

      editExpenseQuantity.addEventListener("input", () => {
        const negativeRemoved = removeNegativeSigns(editExpenseQuantity.value);
        editExpenseQuantity.value = negativeRemoved;
      });

      // Focus on the first input field to handle Enter key
      document.getElementById("editExpenseName").focus();
    }
  };


  // Event listener for handling click events on expense list items
  expenseList.addEventListener("click", (e) => {
    // Check if the clicked element is the edit button or its child
    if (e.target.classList.contains("edit-expense") || e.target.closest(".edit-expense")) {
      const button = e.target.closest(".edit-expense");
      const id = parseInt(button.dataset.id, 10);
      if (!isNaN(id)) {
        editExpense(id);
      }
    }
    // Check if the clicked element is the delete button or its child
    else if (e.target.classList.contains("delete-expense") || e.target.closest(".delete-expense")) {
      const button = e.target.closest(".delete-expense");
      const row = button.closest("tr");

      // Check if a row was found
      if (row) {
        const id = parseInt(row.dataset.id, 10);

        // Ensure the ID is valid
        if (!isNaN(id)) {
          // Remove the expense from the array and update local storage
          deleteExpense(id);

          // Remove the row from the table
          row.remove();

          // Update the stored expenses and total display
          saveExpenses();
          updateTotal();
        } else {
          console.error("Invalid ID for expense:", id);
        }
      } else {
        console.error("Could not find the parent row for the delete button.");
      }
    }
  });

  // Function to delete an expense by ID and update the total expenses display
  const deleteExpense = (id) => {
    expenses = expenses.filter((expense) => expense.id !== id);
  }

  // Function to calculate and update the total expenses, or clear the display if no expenses exist
  const updateTotal = () => {
    if (expenses.length !== 0) {
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const words = numberToWords(total);
      const numbers = formatNumberWithCommas(total.toFixed(2));
      const combined = `${numbers} (${words} Pesos)`;
      totalExpensesDisplay.value = combined;
    } else {
      clearInputs(totalExpensesDisplay);
    }
  }

  // Function to display a reusable alert message with animations
  const alertMessage = (text, alertType, variable) => {
    const animateIn = "animate__bounceIn";
    const animateOut = "animate__bounceOut";
    const addShadow = "shadow";

    if (variable.timeoutId) {
      clearTimeout(variable.timeoutId);
      variable.timeoutId = null;
    }

    variable.className = "";
    variable.textContent = text;
    variable.classList.add("alert", alertType, "mt-1", "d-none", addShadow);

    variable.classList.remove("d-none");
    variable.classList.add("show", "animate__animated", animateIn);

    const handleAnimationEnd = () => {
      variable.classList.remove("show", "animate__animated", animateOut, addShadow);
      variable.classList.add("d-none");
      variable.removeEventListener("animationend", handleAnimationEnd);
    };

    variable.timeoutId = setTimeout(() => {
      variable.classList.remove(animateIn);
      variable.classList.add(animateOut);

      variable.addEventListener("animationend", handleAnimationEnd, { once: true });
    }, 2000);
  };

  // Function to clear all expenses with a confirmation prompt
  const showConfirmationModal = () => {
    // Create modal elements dynamically
    const modalHtml = `
        <div class="modal fade" id="dynamicModal" tabindex="-1" aria-labelledby="dynamicModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="dynamicModalLabel">Confirm Deletion</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="confirmationAlertModalNoInput" role="alert"></div>
                        <div id="confirmationAlertModalInvalidInput" role="alert"></div>
                        <p>Are you sure you want to delete all of your expenses?</p>
                        <input type="text" id="confirmationInput" class="form-control" placeholder="Type 'CONFIRM' here" autocomplete="off">
                    </div>
                    <div class="modal-footer d-flex justify-content-between">
                      <div>
                        <button type="button" class="btn btn-success btn-sm" id="exportButton" title="Export Expense Data (XLSX)">Export</button>
                      </div>
                      <div>
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger btn-sm" id="confirmButton">Confirm</button>
                      </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Append modal HTML to the body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize Bootstrap modal
    const dynamicModal = new bootstrap.Modal(document.getElementById('dynamicModal'));
    const confirmButton = document.getElementById('confirmButton');
    const confirmationInput = document.getElementById('confirmationInput');
    const exportButton = document.getElementById('exportButton');

    // Show the modal
    dynamicModal.show();
    isModalOpen = true; // Set the flag when modal is open

    // Focus on the input field when the modal is shown
    document.getElementById('dynamicModal').addEventListener('shown.bs.modal', () => {
      confirmationInput.focus();
    });

    // Function to handle the confirmation logic
    const handleConfirm = () => {
      const userInput = confirmationInput.value.trim().toUpperCase();

      if (userInput === 'CONFIRM') {
        // Call your function to clear all expenses here
        clearExpenses();
        clearInputs(expenseNameInput, costInput);
        renderExpense();
        saveExpenses();
        updateTotal();
        dynamicModal.hide();
        removeModal();
      } else if (userInput === '') {
        alertMessage("No input provided. Please try again.", "alert-danger", document.getElementById('confirmationAlertModalNoInput'));
      } else {
        alertMessage('Incorrect input. Please type "CONFIRM" to proceed.', "alert-warning", document.getElementById('confirmationAlertModalInvalidInput'));
        clearInputs(document.getElementById('confirmationInput'));
        document.getElementById('dynamicModal').addEventListener('shown.bs.modal', () => {
          confirmationInput.focus();
        });
      }
    };

    // Handle confirm button click
    confirmButton.addEventListener('click', handleConfirm);

    exportButton.addEventListener('click', () => {
      dynamicModal.hide();
      exportToExcel();
    });

    // Handle Enter key press
    confirmationInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        handleConfirm();
      }
    });

    // Cleanup if modal is dismissed without confirmation
    document.getElementById('dynamicModal').addEventListener('hidden.bs.modal', () => {
      removeModal();
      isModalOpen = false;
    });

    // Function to safely remove the modal from the DOM
    function removeModal() {
      const modalElement = document.getElementById('dynamicModal');
      if (modalElement) {
        modalElement.remove();
      }
      // Reset the flag when modal is closed
    }
  };


  costInput.addEventListener("input", formatNumber);

  // Add an event listener to the quantity input field that triggers on any input change
  quantityInput.addEventListener("input", () => {
    const cleanedValue = removePointAndFollowingDigit(quantityInput.value);
    quantityInput.value = cleanedValue; // Update the input field value
  });

  // Add another event listener to the quantity input field to remove negative signs
  quantityInput.addEventListener("input", () => {
    const negativeRemoved = removeNegativeSigns(quantityInput.value);
    quantityInput.value = negativeRemoved;
  });

  // Add another event listener to the quantity input field to remove negative signs
  costInput.addEventListener("input", () => {
    const negativeRemoved = removeNegativeSigns(costInput.value);
    costInput.value = negativeRemoved;
  });

  // Arrow function to reset the date picker
  const resetDatePicker = () => {
    dateFilter.value = ""; // Reset the date picker
  };

  // Add event listener to the search button
  searchFilter.addEventListener("click", () => {
    resetDatePicker(); // Call the function to reset the date picker
    renderExpense(); // Call renderExpense to update the expense list based on search input
  });

  // Add event listener to the search input field
  searchFilter.addEventListener("focus", () => {
    resetDatePicker(); // Call the function to reset the date picker when search input gains focus
    renderExpense(); // Call renderExpense to update the expense list based on search input
  });

  searchFilter.addEventListener("input", renderExpense);
  dateFilter.addEventListener("input", renderExpense);

  // Event listener for the "Add Expense" button
  addExpenseButton.addEventListener("click", addExpense);

  // Event listener for the "Clear All Expenses" button
  clearAllExpensesButton.addEventListener("click", () => {
    if (expenses.length === 0) {
      alertMessage("Your expense table is currently empty.", "alert-warning", emptyAlert);
    } else {
      showConfirmationModal();
    }
  });

  // Remove Animation (Experimental)

  expenseList.childNodes.forEach(function (child) {
    child.classList.add('animate__backOutLeft');

    // Wait for the animation to finish before removing the element
    child.addEventListener('animationend', function () {
      expenseList.removeChild(child);
    });
  });

  // Arrow function to export data to Excel
  // Function to format a number as currency with a peso sign
  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Function to export expenses to Excel
  const exportToExcel = () => {
    // Calculate the sum of all expenses
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Clone the expenses array and add the total row
    const dataWithTotal = [
      ...expenses.map(expense => ({
        ...expense,
        originalAmount: formatCurrency(expense.originalAmount),
        amount: formatCurrency(expense.amount)
      })),
      {
        id: '',
        name: 'Total',
        originalAmount: '',
        amount: formatCurrency(totalExpense),
        quantity: '',
        date: '',
        timestamp: ''
      }
    ];

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert the array of objects to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataWithTotal);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Export the workbook to an Excel file
    XLSX.writeFile(workbook, "exported_expenses.xlsx");
  };

  // Add event listener to the button
  exportButton.addEventListener("click", () => {
    if (expenses.length < 2) {
      alertMessage("Insufficient expenses.", "alert-warning", document.getElementById("insufficientAlert"));
    } else {
      exportToExcel();
    }
  });

  // Initial rendering of the expense list
  renderExpense();
});