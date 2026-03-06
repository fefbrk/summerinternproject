import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import privacyBanner from '@/assets/privacy/Screen-Shot-2022-11-06-at-12.webp';

const PrivacyPolicy = () => {
  return (
    <div className="flex flex-col min-h-screen bg-orange-50">
      <Header />
      <main className="flex-grow">
        {/* --- Privacy Policy Banner Section --- */}
        <div className="bg-gradient-to-r from-kibo-purple to-kibo-orange overflow-hidden">
          <div className="container mx-auto px-4 flex items-center h-64 overflow-hidden">
            <div className="w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">Privacy Policy</h2>
              <p className="text-white/90 mb-6">
                At KinderLab Robotics, we are committed to protecting the privacy and security of our customers, 
                especially children. This Privacy Policy outlines how we collect, use, and protect your personal 
                information when you visit our website, purchase our products, or interact with our services.
              </p>
            </div>
            <div className="w-1/3 flex justify-end items-center h-full">
              <img src={privacyBanner} alt="Privacy Policy" className="max-h-[90%] w-[55%] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>

        {/* --- Privacy Policy Content Section --- */}
        <div className="bg-orange-50 py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Section 1: Title and Introduction */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h1 className="text-4xl font-bold text-center text-kibo-orange mb-8">
                KinderLab Robotics, Inc.'s Privacy Policy
              </h1>
              
              <div className="grid md:grid-cols-2 gap-8 text-gray-700 leading-relaxed">
                <div>
                  <p>
                    This Privacy Policy document contains types of information that is 
                    collected and recorded by KinderLab Robotics and how we use it. 
                    Additionally, we collect information about you during the 
                    checkout process on our store, when you create an account, and 
                    when you choose to post comments on our website.
                  </p>
                </div>
                <div>
                  <p>
                    This Privacy Policy applies only to our online activities and is valid 
                    for visitors to our website with regards to the information that 
                    they share. This policy is not applicable to any information 
                    collected offline or via channels other than this website.
                  </p>
                  <p className="mt-4">
                    Our website address is: <a href="" className="text-kibo-orange hover:underline">https://www.kinderlabrobotics.com</a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Detailed Privacy Policy Content */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <div>
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">What we collect and store:</h2>
                  
                  <p className="mb-4">While you visit our site, we'll track:</p>
                  
                  <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Products you've viewed: we'll use this to, for example, show you products you've recently viewed</li>
                    <li>Location, IP address and browser type: we'll use this for purposes like estimating taxes and shipping</li>
                    <li>Shipping address: we'll ask you to enter this so we can, for instance, estimate shipping before you place an order, and send you the order!</li>
                  </ul>
                  
                  <p className="mb-4">We'll also use cookies to keep track of cart contents while you're browsing our site.</p>
                  
                  <p className="mb-4">
                    When you purchase from us, we'll ask you to provide information including your name, billing address, shipping address, email address, phone 
                    number, optional purchase-order references, and optional account information like username and password. We'll use this information for purposes, such 
                    as, to:
                  </p>
                  
                  <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Send you information about your account and order</li>
                    <li>Respond to your requests, including refunds and complaints</li>
                    <li>Track pending payment state until a payment provider is connected</li>
                    <li>Set up your account for our store</li>
                    <li>Comply with any legal obligations we have, such as calculating taxes</li>
                    <li>Improve our store offerings</li>
                    <li>Send you marketing messages, if you choose to receive them</li>
                    <li>If you create an account, we will store your name, address, email, and phone number, which will be used to populate the checkout for future orders.</li>
                  </ul>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Who on our team has access</h2>
                  
                  <p className="mb-4">Administrators and Shop Managers can access to the information you provide, such as:</p>
                  
                  <ul className="list-disc pl-6 space-y-2 mb-6">
                    <li>Order information: what was purchased, when it was purchased and where it should be sent</li>
                    <li>Customer information: your name, email address, and billing and shipping information.</li>
                    <li>Our team members have access to this information to help fulfill orders, process refunds, and offer support.</li>
                  </ul>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Payments</h2>
                  
                  <p className="mb-4">We do not process card payments directly in the current pre-PSP phase of this project.</p>
                  
                  <p className="mb-4">
                    Orders can be created in a <strong>payment pending</strong> state or flagged with an offline purchase-order reference. No credit card number,
                    CVV, PayPal credential, or payment-provider token is collected or stored until a production payment provider is selected and integrated.
                  </p>
                  
                  <p className="mb-4">
                    Once a payment provider is selected, this policy will be updated to document the processor, the shared data fields, and the relevant privacy terms.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Media</h2>
                  
                  <p className="mb-4">
                    If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website 
                    can download and extract any location data from images on the website.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Cookies</h2>
                  
                  <p className="mb-4">
                    If you build a user profile, you can save your name, email address, address, and other information with cookies. These are for your convenience so 
                    that you do not have to fill in your details again. These cookies will last for one year.
                  </p>
                  
                  <p className="mb-4">
                    If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and 
                    is discarded when you close your browser.
                  </p>
                  
                  <p className="mb-4">
                    When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two 
                    days, and screen options cookies last for a year. If you select "Remember Me", your login will persist for two weeks. If you log out of your account, 
                    the login cookies will be removed.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Embedded content from other websites</h2>
                  
                  <p className="mb-4">
                    Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the 
                    exact same way as if the visitor has visited the other website.
                  </p>
                  
                  <p className="mb-4">
                    These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded 
                    content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Who we share your data with</h2>
                  
                  <p className="mb-4">
                    We will not share your data with third-party payment processors during the current pre-PSP phase. If a processor is added later, this policy will be updated before go-live.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">How long we retain your data</h2>
                  
                  <p className="mb-4">
                    For users that register on our website with a user profile on our store, we will store the information about you for as long as we need the 
                    information for the purposes for which we collect and use it, but we are not legally required to continue to keep it. For example, we will store 
                    order information for tax and accounting purposes. This includes your name, email address and billing and shipping addresses.
                  </p>
                  
                  <p className="mb-4">
                    All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can 
                    also see and edit that information.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">What rights you have over your data</h2>
                  
                  <p className="mb-4">
                    If you have an account on this site you can request to receive an exported file of the personal data we hold about you, including any data you have 
                    provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep 
                    for administrative, legal, or security purposes.
                  </p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-semibold text-kibo-purple mb-4">Consent</h2>
                  
                  <p className="mb-4">
                    By using our website, you hereby consent to our Privacy Policy and agree to its Terms and Conditions.
                  </p>
                  
                  <p className="mb-4">
                    If you have any questions or require more information about our Privacy Policy, do not hesitate to contact us at <a href="mailto:info@kinderlabrobotics.com" className="text-kibo-orange hover:underline">info@kinderlabrobotics.com</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
