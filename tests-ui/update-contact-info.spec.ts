import { test, expect, Tags, featureTag, ticketTitle, Tickets } from '../src/ui/fixtures';

/**
 * The phone numbers the update test swaps between. They are test data, not
 * credentials - the assertion is that a change is accepted and confirmed.
 */
const PHONE_NUMBERS = ['5551234567', '5557654321'];

/**
 * Update Contact Info (PB-1014).
 *
 * The form behind "Update Contact Info" in the post-login menu. ParaBank
 * fills the form in with the signed-in customer's profile after the page
 * has loaded, so every assertion waits for the value it expects instead of
 * pausing for a fixed amount of time.
 *
 * The pre-filled test is read-only and runs against the seeded demo
 * customer. The update test registers its own customer so the demo
 * customer's profile is never changed.
 */
test.describe('Update Contact Info', () => {
  test(
    ticketTitle(Tickets.updateContactInfo, 'pre-fills the form with the current profile'),
    { tag: [Tags.SMOKE, Tags.REGRESSION, featureTag('ui-update-contact-info')] },
    async ({ overviewPage, updateContactInfoPage }) => {
      await overviewPage.menuUpdateContactInfo.click();

      await expect(updateContactInfoPage.firstNameInput).not.toHaveValue('');

      const profile = await updateContactInfoPage.getCurrentProfile();
      expect(profile.firstName.length).toBeGreaterThan(0);
      expect(profile.lastName.length).toBeGreaterThan(0);
      expect(profile.address.length).toBeGreaterThan(0);
      expect(profile.city.length).toBeGreaterThan(0);
      expect(profile.state.length).toBeGreaterThan(0);
      expect(profile.zipCode.length).toBeGreaterThan(0);
      expect(profile.phone.length).toBeGreaterThan(0);
    },
  );

  test(
    ticketTitle(Tickets.updateContactInfo, 'confirms a changed phone number'),
    { tag: [Tags.MUTATING, Tags.SMOKE, Tags.REGRESSION, featureTag('ui-update-contact-info')] },
    async ({ registeredCustomer, accountOverviewPage, updateContactInfoPage }) => {
      await accountOverviewPage.menuAccountOverview.waitFor({ state: 'visible' });

      await updateContactInfoPage.open();
      await expect(updateContactInfoPage.firstNameInput).not.toHaveValue('');
      const profile = await updateContactInfoPage.getCurrentProfile();
      const newPhone = PHONE_NUMBERS.find((phone) => phone !== profile.phone) ?? PHONE_NUMBERS[0];

      await updateContactInfoPage.updateProfile({ ...profile, phone: newPhone });
      await updateContactInfoPage.waitForResult();

      await expect(updateContactInfoPage.successHeading).toBeVisible();
      await expect(updateContactInfoPage.successHeading).toHaveText(/Profile Updated/i);
      await expect(updateContactInfoPage.errorPanel).toBeHidden();
    },
  );
});
