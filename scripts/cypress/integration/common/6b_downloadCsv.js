import { mainPage } from "../../support/page_objects/mainPage";
import { loginPage } from "../../support/page_objects/navigation";
import {
  isPostgres,
  isTestSuiteActive,
} from "../../support/page_objects/projectConstants";

export const genTest = (apiType, dbType) => {
  if (!isTestSuiteActive(apiType, dbType)) return;

  describe(`${apiType.toUpperCase()} Upload/ Download CSV`, () => {
    // before(() => {
    //     // standalone test
    //     // loginPage.loginAndOpenProject(apiType, dbType);
    // });

    beforeEach(() => {
      cy.restoreLocalStorage();
    });

    afterEach(() => {
      cy.saveLocalStorage();
    });

    it("Download verification- base view, default columns", () => {
      cy.openTableTab("Country", 25);

      mainPage.hideField("LastUpdate");
      const verifyCsv = (retrievedRecords) => {
        // expected output, statically configured
        // let storedRecords = [
        //     `Country,CityList`,
        //     `Afghanistan,Kabul`,
        //     `Algeria,"Batna, Bchar, Skikda"`,
        //     `American Samoa,Tafuna`,
        //     `Angola,"Benguela, Namibe"`,
        // ];
        let storedRecords = [
          ["Country", "City List"],
          ["Afghanistan", "Kabul"],
          ["Algeria", "Skikda", "Bchar", "Batna"],
          ["American Samoa", "Tafuna"],
          ["Angola", "Benguela", "Namibe"],
        ];

        // if (isPostgres()) {
        //     // order of second entry is different
        //     storedRecords = [
        //         `Country,City List`,
        //         `Afghanistan,Kabul`,
        //         `Algeria,"Skikda, Bchar, Batna"`,
        //         `American Samoa,Tafuna`,
        //         `Angola,"Benguela, Namibe"`,
        //     ];
        // }

        for (let i = 0; i < storedRecords.length - 1; i++) {
          for (let j = 0; j < storedRecords[i].length; j++)
            expect(retrievedRecords[i]).to.have.string(storedRecords[i][j]);

          // often, the order in which records "Skikda, Bchar, Batna" appear, used to toggle
          // hence verifying record contents separately
          // expect(retrievedRecords[i]).to.be.equal(storedRecords[i]);
        }
      };

      // download & verify
      mainPage.downloadAndVerifyCsv(`Country_exported_1.csv`, verifyCsv);
      mainPage.unhideField("LastUpdate");

      cy.closeTableTab("Country");
    });
  });
};

