declare module NodeJS {
    interface Process extends NodeJS.Process {
        browser?: string;
    }
}
