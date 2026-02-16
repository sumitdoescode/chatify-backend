import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Tailwind } from "@react-email/components";

type EmailTemplateProps = {
    name: string;
    email: string;
    verificationUrl: string;
};

const EmailVerificationTemplate = ({ name = "there", email = "example@gmail.com", verificationUrl }: EmailTemplateProps) => {
    return (
        <Html lang="en" dir="ltr">
            <Tailwind>
                <Head />
                <Preview>Please verify your email address to complete your account setup</Preview>
                <Body className="bg-gray-100 font-sans py-10">
                    <Container className="bg-white mx-auto px-8 py-12 max-w-150 rounded-xl">
                        {/* Main content */}
                        <Section>
                            <Heading className="text-[36px] font-bold text-gray-900 mb-8">Hi, {name}</Heading>

                            <Heading className="text-[28px] font-bold text-gray-900 mb-6">Verify your email</Heading>

                            <Text className="text-[16px] text-gray-700 mb-[32px] leading-[24px]">
                                We need to verify your email address to complete your account setup. Please click the button below to verify <strong>{email}</strong>.
                            </Text>

                            {/* Verification button */}
                            <Section className="text-center mb-[32px]">
                                <Button href={verificationUrl} className="box-border bg-[oklch(0.65_0.18_132)] text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-medium no-underline inline-block">
                                    Verify Email Address
                                </Button>
                            </Section>

                            <Text className="text-[14px] text-gray-600 leading-[20px] mb-[24px]">If you didn't create an account, you can safely ignore this email.</Text>

                            <Text className="text-[14px] text-gray-600 leading-[20px]">This verification link will expire in 24 hours for security reasons.</Text>
                        </Section>

                        {/* Footer */}
                        <Section className="border-t border-gray-200 pt-[32px] mt-[48px]">
                            <Text className="text-[12px] text-gray-500 text-center m-0 mb-[8px]">© 2026 Your Company Name. All rights reserved.</Text>
                            <Text className="text-[12px] text-gray-500 text-center m-0 mb-[8px]">123 Business Street, Suite 100, City, State 12345</Text>
                            <Text className="text-[12px] text-gray-500 text-center m-0">
                                <a href="#" className="text-gray-500 no-underline">
                                    Unsubscribe
                                </a>
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailVerificationTemplate.PreviewProps = {
    username: "Sumit",
    userEmail: "sumit.does.code@gmail.com",
    verificationUrl: "https://example.com/verify?token=abc123",
};

export default EmailVerificationTemplate;
